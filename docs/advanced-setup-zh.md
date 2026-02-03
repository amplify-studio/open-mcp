# 高级配置指南

本指南涵盖 Open MCP Server 的高级配置选项。

## 目录

- [认证配置](#认证配置)
- [代理配置](#代理配置)
- [HTTP 传输模式](#http-传输模式)
- [自定义 User-Agent](#自定义-user-agent)
- [故障排查](#故障排查)

---

## 认证配置

如果您的 Gateway API 需要 HTTP 基本身份验证，请配置以下环境变量：

### 配置方法

```json
{
  "mcpServers": {
    "open-mcp": {
      "command": "npx",
      "args": ["-y", "@amplify-studio/open-mcp@latest"],
      "env": {
        "GATEWAY_URL": "http://your-gateway.com:80",
        "AUTH_USERNAME": "your-username",
        "AUTH_PASSWORD": "your-password"
      }
    }
  }
}
```

**重要提示**: `AUTH_USERNAME` 和 `AUTH_PASSWORD` 必须同时设置。只设置其中一个会导致配置错误。

---

## 代理配置

如果您需要通过代理服务器访问 Gateway，请配置以下环境变量：

### HTTP/HTTPS 代理

```json
{
  "env": {
    "GATEWAY_URL": "http://gateway.com",
    "HTTP_PROXY": "http://proxy.example.com:8080",
    "HTTPS_PROXY": "http://proxy.example.com:8080"
  }
}
```

### 带认证的代理

```json
{
  "env": {
    "HTTP_PROXY": "http://username:password@proxy.example.com:8080"
  }
}
```

### 代理绕过

使用 `NO_PROXY` 指定不需要通过代理访问的主机：

```json
{
  "env": {
    "HTTP_PROXY": "http://proxy.company.com:8080",
    "NO_PROXY": "localhost,127.0.0.1,.local,.company.com"
  }
}
```

**NO_PROXY 模式说明**:
- `localhost` - 绕过本地主机
- `127.0.0.1` - 绕过本地 IP
- `.example.com` - 绕过 example.com 的所有子域名
- `example.com` - 绕过 example.com 及其子域名
- `*` - 绕过所有主机（禁用代理）

---

## HTTP 传输模式

默认情况下，Open MCP Server 使用 STDIO 传输模式。对于远程部署或 Web 应用程序，您可以启用 HTTP 传输模式。

### 启动 HTTP 服务器

设置 `MCP_HTTP_PORT` 环境变量：

```bash
MCP_HTTP_PORT=3333 \
GATEWAY_URL=http://your-gateway.com:80 \
npx @amplify-studio/open-mcp@latest
```

服务器将在指定端口启动，并提供：
- **HTTP 端点**: `http://localhost:3333/mcp`
- **健康检查**: `http://localhost:3333/health`

### 通过 Claude Code 连接

```bash
claude mcp add --transport http open-mcp http://localhost:3333/mcp
```

### HTTP vs STDIO 对比

| 特性 | STDIO（默认） | HTTP 模式 |
|---------|-----------------|-----------|
| 使用场景 | 桌面应用 | 远程/Web 应用 |
| 配置复杂度 | 较简单 | 需要指定端口 |
| 性能 | 本地使用更好 | 远程访问更好 |
| 传输方式 | 标准输入/输出 | HTTP + SSE |

---

## 自定义 User-Agent

为向 Gateway 发送的请求自定义 User-Agent 头：

```json
{
  "env": {
    "USER_AGENT": "MyBot/1.0 (+https://mywebsite.com/bot)"
  }
}
```

**注意**: 仅当您的 Gateway 需要特定的 User-Agent 用于身份识别或速率限制时才设置此项。

---

## 故障排查

### Gateway 连接问题

**问题**: "Connection Error" 或 "DNS Error"

**解决方案**:
1. 验证 `GATEWAY_URL` 正确且可访问
2. 检查 Gateway 服务是否运行
3. 如果使用代理，验证代理设置
4. 检查防火墙规则

### 认证失败

**问题**: "403 Forbidden" 或 "401 Unauthorized"

**解决方案**:
1. 验证 `AUTH_USERNAME` 和 `AUTH_PASSWORD` 都已设置
2. 与 Gateway 管理员确认凭据
3. 确保 Gateway 配置了 Basic Auth

### 代理不工作

**问题**: 流量未通过代理

**解决方案**:
1. 验证代理 URL 格式：`http://proxy:port` 或 `http://user:pass@proxy:port`
2. 检查 `NO_PROXY` 是否包含您的 Gateway 主机
3. 确保代理支持 HTTPS（如果使用 `HTTPS_PROXY`）

### 图像工具不工作

**问题**: 图像功能返回错误

**解决方案**:
1. 验证 `ZHIPUAI_API_KEY` 已正确设置
2. 检查 API 密钥格式：`id.secret`
3. 确保 API 密钥有效（有可用配额）
4. 在[智谱 AI 控制台](https://www.bigmodel.cn/usercenter/proj-mgmt/apikeys)测试 API 密钥

---

## 完整配置示例

这是一个包含所有高级选项的完整示例：

```json
{
  "mcpServers": {
    "open-mcp": {
      "command": "npx",
      "args": ["-y", "@amplify-studio/open-mcp@latest"],
      "env": {
        "GATEWAY_URL": "http://company-gateway.internal:80",
        "AUTH_USERNAME": "mcp-user",
        "AUTH_PASSWORD": "secure-password",
        "HTTP_PROXY": "http://proxy.company.com:8080",
        "HTTPS_PROXY": "http://proxy.company.com:8080",
        "NO_PROXY": "localhost,127.0.0.1,.company.internal",
        "ZHIPUAI_API_KEY": "your-zhipu-api-key",
        "USER_AGENT": "MyMCP/1.0"
      }
    }
  }
}
```

---

## 需要帮助？

- **问题反馈**: [GitHub Issues](https://github.com/amplify-studio/open-mcp/issues)
- **主文档**: [主 README](../README.md)
- **MCP 协议**: [Model Context Protocol 规范](https://modelcontextprotocol.io/)
