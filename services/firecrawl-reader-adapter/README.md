# Firecrawl Reader Adapter

Jina Reader API 兼容的适配器服务，使用 Firecrawl 作为后端引擎。作为 [Open MCP](../../) 项目的一部分，提供网页内容提取功能。

## 快速开始

### 通过 MCP 工具调用（推荐）

如果你在使用 MCP 客户端（如 Claude Desktop、Claude Code），可以直接调用 `web_url_read` 工具：

```javascript
// Claude Desktop / MCP 客户端
{
  "name": "web_url_read",
  "arguments": {
    "url": "https://example.com",
    "onlyMainContent": true
  }
}
```

### 通过 HTTP API

```bash
# 通过 Nginx 网关（推荐）
curl "http://localhost:80/api/read/https://example.com"

# POST 方式
curl -X POST http://localhost:80/api/read \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Docker Compose

```bash
# 启动服务
docker compose up -d firecrawl-reader-adapter

# 检查健康状态
curl http://localhost:8082/health
```

---

## MCP 安装

### `claude mcp add` 命令详解

#### 基本语法

```bash
claude mcp add [options] <name> <commandOrUrl> [args...]
```

#### 常用选项

| 选项 | 说明 | 示例 |
|------|------|------|
| `-t, --transport` | 传输类型: `stdio`, `sse`, `http` | `--transport http` |
| `-e, --env` | 设置环境变量 | `-e API_KEY=xxx` |
| `-H, --header` | 设置 HTTP 头 | `-H "Authorization: Bearer xxx"` |
| `-s, --scope` | 配置范围: `local`, `user`, `project` | `--scope user` |

#### Option 1: 添加 stdio 服务器（推荐）

```bash
# 基础安装
claude mcp add open-mcp -- npx -y @amplify-studio/open-mcp@latest

# 带自定义网关
claude mcp add -e GATEWAY_URL=http://localhost:80 open-mcp -- npx -y @amplify-studio/open-mcp@latest

# 全局安装（user scope）
claude mcp add -s user open-mcp -- npx -y @amplify-studio/open-mcp@latest
```

#### Option 2: 添加 HTTP 服务器

```bash
# 基础 HTTP 服务器
claude mcp add --transport http open-mcp http://localhost:3333/mcp

# 带认证的 HTTP 服务器
claude mcp add --transport http -H "Authorization: Bearer xxx" open-mcp https://api.example.com/mcp
```

#### Option 3: Claude Desktop 配置

编辑 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "open-mcp": {
      "command": "npx",
      "args": ["-y", "@amplify-studio/open-mcp@latest"],
      "env": {
        "GATEWAY_URL": "http://localhost:80"
      }
    }
  }
}
```

配置文件位置：
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

#### 常用管理命令

```bash
# 列出所有 MCP 服务器
claude mcp list

# 查看服务器详情
claude mcp get open-mcp

# 删除服务器
claude mcp remove open-mcp

# 从 Claude Desktop 导入
claude mcp add-from-claude-desktop
```

---

## API 文档

### MCP 工具参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `url` | string | ✅ | - | 目标 URL |
| `onlyMainContent` | boolean | ❌ | `true` | 仅提取主要内容 |
| `includeHtml` | boolean | ❌ | `false` | 包含 HTML 格式 |
| `waitFor` | integer | ❌ | - | 等待毫秒数（动态内容） |
| `screenshot` | boolean | ❌ | `false` | 包含截图 |

### HTTP 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/` | 服务信息和端点列表 |
| GET | `/api/read/<url>` | 读取 URL 内容 |
| POST | `/api/read` | 读取 URL 内容（JSON 参数） |

### 响应格式

```json
{
  "success": true,
  "content": "# Example Domain\n\n...",
  "url": "https://example.com",
  "metadata": {
    "title": "Example Domain",
    "language": "en",
    "statusCode": 200,
    "contentType": "text/html"
  }
}
```

---

## 配置

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `FIRECRAWL_API_URL` | `http://firecrawl-api:3002` | Firecrawl API 地址 |
| `FIRECRAWL_API_KEY` | (空) | API Key（可选） |
| `PORT` | `8082` | 服务端口 |

### Docker Compose 示例

```yaml
services:
  firecrawl-reader-adapter:
    build:
      context: ./services/firecrawl-reader-adapter
    environment:
      FIRECRAWL_API_URL: http://firecrawl-api:3002
      PORT: 8082
    networks:
      - mcp-network
```

---

## 架构

```
用户请求 (MCP/HTTP)
    ↓
Nginx 网关 (:80)
    ↓
Reader Adapter (:8082)
    ↓
Firecrawl API (:3002)
    ↓
Playwright Browser
```

---

## 使用示例

```bash
# MCP 客户端调用
# {"name": "web_url_read", "arguments": {"url": "https://example.com"}}

# HTTP GET
curl "http://localhost:80/api/read/https://example.com"

# HTTP POST
curl -X POST http://localhost:80/api/read \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "onlyMainContent": true}'

# 带等待时间
curl "http://localhost:80/api/read/https://example.com?waitFor=2000"
```
