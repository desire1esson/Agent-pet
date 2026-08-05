// zero-pet Rust 壳
// - move_window: 前端拖拽时移动窗口
// - snap_to_corner: 窗口吸附到屏幕右下角（桌宠默认位置）
// - ws_proxy: 本地 WS 代理（127.0.0.1:9120 → Hermes 9119）
//   浏览器 WS 会带页面 Origin（http://tauri.localhost），Hermes 只接受 localhost/127.0.0.1
//   → 前端连本地代理（不校验 Origin），代理去掉 Origin 转发给 Hermes——绕开 CORS 白名单
//   ⚠ 本文件 CRLF 字符串用 \r\n（write_file 全量重写，勿用 patch——patch 会破坏转义）

use tauri::PhysicalPosition;

#[tauri::command]
fn move_window(window: tauri::Window, x: i32, y: i32) {
    let _ = window.set_position(PhysicalPosition::new(x, y));
}
#[tauri::command]
fn snap_to_corner(window: tauri::Window) {
    if let Some(monitor) = window.current_monitor().ok().flatten() {
        let size = monitor.size();
        let wsize = window.outer_size().ok().unwrap_or_default();
        let x = size.width as i32 - wsize.width as i32 - 24;
        let y = size.height as i32 - wsize.height as i32 - 16;
        let _ = window.set_position(PhysicalPosition::new(x, y));
    }
}

/// WS 代理：监听 127.0.0.1:9120，转发到 Hermes（127.0.0.1:9119，token 透传）
fn start_ws_proxy() {
    std::thread::spawn(|| {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_io()
            .build()
            .expect("proxy runtime");
        rt.block_on(ws_proxy_loop());
    });
}

async fn ws_proxy_loop() {
    use futures_util::{SinkExt, StreamExt};
    use tokio::net::{TcpListener, TcpStream};

    let listener = match TcpListener::bind("127.0.0.1:9120").await {
        Ok(l) => l,
        Err(e) => {
            eprintln!("[zero-pet] ws_proxy bind 9120 failed: {e}");
            return;
        }
    };
    loop {
        let (mut client, _) = match listener.accept().await {
            Ok(c) => c,
            Err(_) => continue,
        };
        tokio::spawn(async move {
            // 1. 读客户端 HTTP 升级请求（拿 URL/token）
            let mut buf = vec![0u8; 8192];
            let n = match tokio::io::AsyncReadExt::read(&mut client, &mut buf).await {
                Ok(n) if n > 0 => n,
                _ => return,
            };
            let head = String::from_utf8_lossy(&buf[..n]).to_string();
            let req_line = head.lines().next().unwrap_or("").to_string();
            let path = req_line
                .split_whitespace()
                .nth(1)
                .unwrap_or("/api/ws")
                .to_string();

            // 2. 连 Hermes
            let mut upstream = match TcpStream::connect("127.0.0.1:9119").await {
                Ok(s) => s,
                Err(_) => return,
            };

            // 3. 重建请求头（去 Origin/Host/sec-fetch-，跳过空行，Host 指向 Hermes）
            let mut fwd = format!("GET {path} HTTP/1.1\r\n");
            for line in head.lines().skip(1) {
                let line = line.trim_end_matches('\r');
                if line.is_empty() {
                    continue; // 客户端请求头的结束空行——跳过
                }
                let lower = line.to_lowercase();
                if lower.starts_with("host:")
                    || lower.starts_with("origin:")
                    || lower.starts_with("sec-fetch-")
                {
                    continue;
                }
                fwd.push_str(line);
                fwd.push_str("\r\n");
            }
            fwd.push_str("Host: 127.0.0.1:9119\r\n");
            fwd.push_str("\r\n");
            if tokio::io::AsyncWriteExt::write_all(&mut upstream, fwd.as_bytes())
                .await
                .is_err()
            {
                return;
            }

            // 4. 读 upstream 的 101 升级响应并转发给 client
            let mut resp = vec![0u8; 4096];
            let rn = tokio::io::AsyncReadExt::read(&mut upstream, &mut resp)
                .await
                .unwrap_or(0);
            if rn == 0 || !String::from_utf8_lossy(&resp[..rn]).starts_with("HTTP/1.1 101") {
                return; // upstream 拒绝（400/403）——不转发
            }
            if tokio::io::AsyncWriteExt::write_all(&mut client, &resp[..rn])
                .await
                .is_err()
            {
                return;
            }

            // 5. 双向透传（握手已完成，包装为帧流）
            let ws_client = tokio_tungstenite::WebSocketStream::from_raw_socket(
                client,
                tokio_tungstenite::tungstenite::protocol::Role::Server,
                None,
            )
            .await;
            let ws_upstream = tokio_tungstenite::WebSocketStream::from_raw_socket(
                upstream,
                tokio_tungstenite::tungstenite::protocol::Role::Client,
                None,
            )
            .await;
            let (mut a_tx, mut a_rx) = ws_client.split();
            let (mut b_tx, mut b_rx) = ws_upstream.split();
            let c2u = async move {
                while let Some(msg) = a_rx.next().await {
                    if b_tx.send(msg.unwrap()).await.is_err() {
                        break;
                    }
                }
            };
            let u2c = async move {
                while let Some(msg) = b_rx.next().await {
                    if a_tx.send(msg.unwrap()).await.is_err() {
                        break;
                    }
                }
            };
            tokio::select! {
                _ = c2u => {},
                _ = u2c => {},
            }
        });
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // 代码创建主窗口（tauri.conf.json 不再声明 windows）
            use tauri::{WebviewUrl, WebviewWindowBuilder};
            WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                .title("zero-pet")
                .inner_size(200.0, 230.0)
                .transparent(true)
                .decorations(false)
                .always_on_top(true)
                .resizable(false)
                .skip_taskbar(true)
                .shadow(false)
                .build()?;
            // 启动本地 WS 代理（前端连 9120 → 转发 Hermes 9119）
            start_ws_proxy();
            setup_tray(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            move_window,
            snap_to_corner,
            load_runtime_config,
            get_history_path,
            save_history,
            load_history,
            clear_history
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// 系统托盘：右键菜单（退出）/ 左键显示窗口
fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    use tauri::menu::{Menu, MenuItem};
    use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

    let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let show = MenuItem::with_id(app, "show", "显示零", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    let mut tray = TrayIconBuilder::with_id("zero-pet-tray");
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => app.exit(0),
            "show" => show_window(app),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_window(tray.app_handle());
            }
        })
        .build(app)?;
    Ok(())
}

fn show_window(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.set_focus();
    }
}

/// 运行时配置（预编译用户编辑 app_data_dir/zero-pet/config.json 连接自己的后端）
#[derive(serde::Serialize, serde::Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct RuntimeConfig {
    host: Option<String>,
    port: Option<u16>,
    token: Option<String>,
}

#[tauri::command]
fn load_runtime_config(app: tauri::AppHandle) -> RuntimeConfig {
    let dir = app.path().app_data_dir().unwrap_or_default().join("zero-pet");
    let f = dir.join("config.json");
    std::fs::read_to_string(&f)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

use std::fs;
use tauri::Manager;

fn history_path(app: &tauri::AppHandle) -> std::path::PathBuf {
    app.path()
        .app_data_dir()
        .expect("app_data_dir 不可用")
        .join("history.json")
}

/// 返回历史文件绝对路径（前端展示/回顾指令用，不硬编码）
#[tauri::command]
fn get_history_path(app: tauri::AppHandle) -> String {
    history_path(&app).to_string_lossy().to_string()
}

/// 保存对话记录（records: {v, records: [{role, text, ts}]}）
#[tauri::command]
fn save_history(app: tauri::AppHandle, records: serde_json::Value) -> Result<(), String> {
    let path = history_path(&app);
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    fs::write(&path, records.to_string()).map_err(|e| e.to_string())
}

/// 读取对话记录（文件不存在返回空结构）
#[tauri::command]
fn load_history(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let path = history_path(&app);
    match fs::read_to_string(&path) {
        Ok(s) => serde_json::from_str(&s).map_err(|e| e.to_string()),
        Err(_) => Ok(serde_json::json!({ "v": 1, "records": [] })),
    }
}

/// 清空对话记录
#[tauri::command]
fn clear_history(app: tauri::AppHandle) -> Result<(), String> {
    let path = history_path(&app);
    let _ = fs::remove_file(&path);
    Ok(())
}
