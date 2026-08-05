// zero-pet Rust 壳
// - move_window: 前端拖拽时移动窗口
// - snap_to_corner: 窗口吸附到屏幕右下角（桌宠默认位置）

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            setup_tray(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            move_window,
            snap_to_corner,
            load_runtime_config,
            ensure_serve,
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

/// 确保 Hermes serve 在运行：探测端口 → 缺失则用 config.json 的 token 拉起
/// （桌宠自托管 serve——用户双击桌宠 = 一切就绪）
#[tauri::command]
fn ensure_serve(app: tauri::AppHandle) -> bool {
    use std::net::TcpStream;
    use std::process::Command;
    use std::time::Duration;

    let cfg = load_runtime_config(app);
    let port = cfg.port.unwrap_or(9119);

    // 探测 serve 已运行？
    let addr = format!("127.0.0.1:{port}");
    if let Ok(a) = addr.parse() {
        if TcpStream::connect_timeout(&a, Duration::from_millis(300)).is_ok() {
            return true; // 已有 serve，直接连
        }
    }

    // 拉起 hermes serve（detached，独立生命周期）
    let mut cmd = Command::new("hermes");
    cmd.args(["serve", "--skip-build"]);
    if let Some(t) = cfg.token {
        cmd.env("HERMES_DASHBOARD_SESSION_TOKEN", t);
    }
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0000_0008); // DETACHED_PROCESS
    }
    cmd.spawn().is_ok()
}

/// 会话历史存储（动态路径 app_data_dir，分发安全）
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
