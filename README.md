# WebSocket 在线测试工具

## 项目简介
基于 Web 的 WebSocket 调试工具，支持 WS/WSS 协议，提供可视化界面用于连接测试、消息收发调试和协议分析。适用于 WebSocket 服务端开发、API 调试。

## 功能特性
✅ 核心功能  
- 支持 WS/WSS 协议连接
- 实时连接状态显示
- 自定义请求参数管理
- 消息双向收发调试
- 自动心跳包机制
- JSON 格式化显示

📊 增强功能
- 消息历史记录查看
- 收发包暂停控制
- 输入内容自动清空
- 本地缓存管理
- 响应数据语法高亮

### 本地部署
```bash
docker pull ghcr.io/fc6a1b03/wstool:latest
docker run -d --name wstool -p 80:80 --restart unless-stopped ghcr.io/fc6a1b03/wstool:latest
```
