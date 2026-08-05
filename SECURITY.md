# 安全说明

## 凭据处理

- **代码零硬编码凭据**——token 不写入源码
- 连接配置来源（优先级）：
  1. 运行时配置文件 `config.json`（用户数据目录，见 README）
  2. 构建环境变量 `VITE_HERMES_TOKEN`
- 桌面形象只连接本地后端（默认 127.0.0.1）

## 数据存储

- 会话历史：本地文件（用户数据目录 `zero-pet/history.json`）
- 设置：WebView localStorage
- **无遥测、无网络上报**——桌面形象不向任何第三方发送数据

## 审批

- 危险操作需用户显式确认（审批卡）——拒绝即不执行
- 审批策略由 agent 侧（Hermes config）决定

## 报告漏洞

发现安全问题请通过 GitHub issue（标记 security）报告，或直接联系维护者。请勿公开披露可利用的漏洞细节。
