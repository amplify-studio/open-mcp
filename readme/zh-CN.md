# Open MCP Search Server

想找免费的搜索和页面读取服务？想要更好的 MCP 接入？来试试这个项目吧！

**语言：** [English](../README.md) | [中文](README.md)

[![npm 版本](https://badge.fury.io/js/%40amplify-studio%2Fopen-mcp.svg)](https://www.npmjs.com/package/@amplify-studio/open-mcp)
[![npm 下载量](https://img.shields.io/npm/dm/@amplify-studio/open-mcp)](https://www.npmjs.com/package/@amplify-studio/open-mcp)
[![Docker 拉取量](https://img.shields.io/docker/pulls/amplifystudio/open-mcp)](https://hub.docker.com/r/amplifystudio/open-mcp)
[![许可证: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub 星标](https://img.shields.io/github/stars/amplify-studio/open-mcp?style=social)](https://github.com/amplify-studio/open-mcp)

一键部署您自己的本地搜索和页面读取服务。由 SearXNG 和 Firecrawl 提供支持，通过 MCP 协议与 Claude 集成。

Deploy your own local web search and page reading service in one click. Powered by SearXNG and Firecrawl, integrated with Claude via MCP protocol.

## 功能特性

### MCP 工具 / MCP Tools

通过 MCP 协议提供给 AI 助手的工具：

- 🔍 **网络搜索** - 支持分页、时间过滤、语言选择的网络搜索
- 📄 **URL 读取** - 将网页内容提取为 markdown，支持高级过滤

### 服务器特性 / Server Features

部署和性能相关的基础设施功能：

- 💾 **智能缓存** - 自动缓存，TTL 过期机制提高性能
- 🔄 **双传输模式** - 支持 STDIO 或 HTTP 模式灵活部署
- 🌐 **代理支持** - 内置代理配置，支持 NO_PROXY 绕过

### 技术支持 / Powered By

| 功能 | 技术支持 |
|---------|------------|
| 搜索 | [SearXNG](https://searxng.org/) - 尊重隐私的元搜索引擎 |
| 抓取 | [Firecrawl](https://www.firecrawl.dev/) - 网页抓取 API |
| 协议 | [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) - 官方实现 |

---

## 兼容客户端

兼容任何 MCP 客户端：

- **Claude Desktop** / **Claude Code** / **Cursor** / **Cline**
- **Continue.dev**
- **HTTP 模式**（用于远程部署）

---

## 快速开始

### 先试试效果？

直接使用我们的 MCP 服务：

```bash
claude mcp add-json -s user mcp-searxng '{
  "command": "npx",
  "args": ["-y", "@amplify-studio/open-mcp@latest"],
  "env": {
    "GATEWAY_URL": "http://115.190.91.253:80"
  }
}'
```

### 效果不错？想自己部署？

继续阅读下面的部署指南

---

## 功能特性

### MCP 工具 / MCP Tools

通过 MCP 协议提供给 AI 助手的工具：

- 🔍 **网络搜索** - 支持分页、时间过滤、语言选择的网络搜索
- 📄 **URL 读取** - 将网页内容提取为 markdown，支持高级过滤

### 服务器特性 / Server Features

部署和性能相关的基础设施功能：

- 💾 **智能缓存** - 自动缓存，TTL 过期机制提高性能
- 🔄 **双传输模式** - 支持 STDIO 或 HTTP 模式灵活部署
- 🌐 **代理支持** - 内置代理配置，支持 NO_PROXY 绕过

### 技术支持 / Powered By

| 功能 | 技术支持 |
|---------|------------|
| 搜索 | [SearXNG](https://searxng.org/) - 尊重隐私的元搜索引擎 |
| 抓取 | [Firecrawl](https://www.firecrawl.dev/) - 网页抓取 API |
| 协议 | [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) - 官方实现 |

---

## 兼容客户端

兼容任何 MCP 客户端，包括：
- **Claude Desktop** / **Claude Code** / **Cursor** / **Cline**
- **Continue.dev**
- **HTTP 模式**（用于远程部署）

### 安装

#### 使用 Claude CLI（推荐）

```bash
claude mcp add-json -s user mcp-searxng '{
  "command": "npx",
  "args": ["-y", "@amplify-studio/open-mcp@latest"],
  "env": {
    "GATEWAY_URL": "https://your-gateway-instance.com"
  }
}'
```

#### 使用 Claude Desktop 配置

编辑 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "mcp-searxng": {
      "command": "npx",
      "args": ["-y", "@amplify-studio/open-mcp@latest"],
      "env": {
        "GATEWAY_URL": "https://your-gateway-instance.com"
      }
    }
  }
}
```

#### 使用 Continue.dev

添加到您的 `config.json`：

```json
{
  "mcpServers": {
    "mcp-searxng": {
      "command": "npx",
      "args": ["-y", "@amplify-studio/open-mcp@latest"],
      "env": {
        "GATEWAY_URL": "https://your-gateway-instance.com"
      }
    }
  }
}
```

#### HTTP 模式

```bash
# 启动 HTTP 服务器
MCP_HTTP_PORT=3333 GATEWAY_URL=https://your-gateway-instance.com npx @amplify-studio/open-mcp@latest

# 从 Claude Code 连接
claude mcp add --transport http mcp-searxng http://localhost:3333/mcp
```

## 使用方法

### 网络搜索工具

**工具名称：** `searxng_web_search`

**参数：**
- `query` (string, required): 搜索查询
- `limit` (number, optional): 最大结果数（1-100，默认：10）

**示例：**

```json
{
  "query": "Model Context Protocol",
  "limit": 5
}
```

**响应：**

```json
{
  "query": "Model Context Protocol",
  "results": [
    {
      "title": "Result Title",
      "content": "Description or snippet...",
      "url": "https://example.com"
    }
  ],
  "totalCount": 5,
  "duration": "234ms"
}
```

### URL 读取工具

**工具名称：** `web_url_read`

**参数：**
- `url` (string, required): 要获取的 URL
- `startChar` (number, optional): 起始字符位置（默认：0）
- `maxLength` (number, optional): 要返回的最大字符数
- `section` (string, optional): 提取特定标题下的内容
- `paragraphRange` (string, optional): 段落范围，如 '1-5'、'3'、'10-'
- `readHeadings` (boolean, optional): 仅返回标题（默认：false）

**示例：**

```json
{
  "url": "https://example.com/article",
  "maxLength": 5000,
  "section": "Introduction"
}
```

**响应：**

```json
{
  "url": "https://example.com/article",
  "content": "# Article Content\n\n...",
  "charCount": 1500,
  "duration": "456ms",
  "cached": false
}
```

## 配置

### 环境变量

| 变量 | 必需 | 默认值 | 描述 |
|---------|---------|---------|-------------------|
| `GATEWAY_URL` | 否 | `http://115.190.91.253:80` | Gateway API URL |
| `AUTH_USERNAME` | 否 | - | HTTP 基本身份验证用户名 |
| `AUTH_PASSWORD` | 否 | - | HTTP 基本身份验证密码 |
| `USER_AGENT` | 否 | - | 自定义 User-Agent 标头 |
| `HTTP_PROXY` | 否 | - | HTTP 请求的代理 URL |
| `HTTPS_PROXY` | 否 | - | HTTPS 请求的代理 URL |
| `NO_PROXY` | 否 | - | 逗号分隔的绕过列表 |
| `MCP_HTTP_PORT` | 否 | - | 在指定端口上启用 HTTP 传输 |

### 完整配置示例

```json
{
  "mcpServers": {
    "mcp-searxng": {
      "command": "npx",
      "args": ["-y", "@amplify-studio/open-mcp@latest"],
      "env": {
        "GATEWAY_URL": "https://search.example.com",
        "AUTH_USERNAME": "your_username",
        "AUTH_PASSWORD": "your_password",
        "USER_AGENT": "MyBot/1.0",
        "HTTP_PROXY": "http://proxy.company.com:8080",
        "HTTPS_PROXY": "http://proxy.company.com:8080",
        "NO_PROXY": "localhost,127.0.0.1,.local,.internal"
      }
    }
  }
}
```

## 安装方法

### 选项 1: NPX（推荐）

```bash
npx -y @amplify-studio/open-mcp@latest
```

### 选项 2: 全局安装

```bash
npm install -g @amplify-studio/open-mcp
mcp-searxng
```

### 选项 3: Docker

#### 使用预构建镜像

```bash
docker pull amplifystudio/open-mcp:latest
```

```json
{
  "mcpServers": {
    "mcp-searxng": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GATEWAY_URL",
        "amplifystudio/open-mcp:latest"
      ],
      "env": {
        "GATEWAY_URL": "https://your-gateway-instance.com"
      }
    }
  }
}
```

#### Docker Compose

```yaml
services:
  mcp-searxng:
    image: amplifystudio/open-mcp:latest
    stdin_open: true
    environment:
      - GATEWAY_URL=https://your-gateway-instance.com
      # 根据需要添加可选变量
      # - AUTH_USERNAME=your_username
      # - AUTH_PASSWORD=your_password
```

### 选项 4: 本地开发

```bash
# 克隆仓库
git clone https://github.com/amplify-studio/open-mcp.git
cd open-mcp

# 安装依赖
npm install

# 构建项目
npm run build

# 直接运行
node dist/index.js
```

## HTTP 传输模式

服务器支持用于远程部署的 HTTP 传输。

### 启动 HTTP 服务器

```bash
# 基本启动
MCP_HTTP_PORT=3333 npx @amplify-studio/open-mcp@latest

# 使用自定义 Gateway
MCP_HTTP_PORT=3333 GATEWAY_URL=https://your-gateway-instance.com npx @amplify-studio/open-mcp@latest

# 后台模式
MCP_HTTP_PORT=3333 npx @amplify-studio/open-mcp@latest &
```

### API 端点

| 端点 | 方法 | 描述 |
|----------|--------|-------------------|
| `/health` | GET | 健康检查 |
| `/mcp` | POST | 发送 JSON-RPC 请求 |
| `/mcp` | GET | 接收 SSE 通知 |
| `/mcp` | DELETE | 关闭会话 |

### 验证连接

```bash
# 健康检查
curl http://localhost:3333/health

# 预期响应
# {"status":"healthy","server":"mcp-searxng","version":"0.9.0","transport":"http"}
```

### curl 命令示例

```bash
# 1. 初始化会话
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": {"name": "test-client", "version": "1.0"}
    }
  }'

# 2. 列出工具（使用返回的 session-id）
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: <session-id>" \
  -d '{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}'

# 3. 调用搜索工具
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: <session-id>" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "searxng_web_search",
      "arguments": {"query": "test", "limit": 5}
    }
  }'
```

## 开发

### 设置

```bash
# 安装依赖
npm install

# 带文件监视的开发模式
npm run watch

# 运行测试
npm test

# 生成覆盖率报告
npm run test:coverage

# 使用 MCP Inspector 测试
npm run inspector

# 生产构建
npm run build
```

### 测试

```bash
# 运行所有测试
npm test

# 运行覆盖率报告
npm run test:coverage

# 测试特定文件
npx tsx __tests__/unit/search.test.ts
```

## 更新

### 使用 Claude CLI

```bash
# 移除旧版本
claude mcp remove mcp-searxng

# 安装最新版本
claude mcp add-json -s user mcp-searxng '{
  "command": "npx",
  "args": ["-y", "@amplify-studio/open-mcp@latest"],
  "env": {
    "GATEWAY_URL": "https://your-gateway-instance.com"
  }
}'
```

### 清除 npx 缓存

如果更新后遇到问题：

```bash
npm cache clean --force
claude mcp remove mcp-searxng
claude mcp add-json -s user mcp-searxng '{
  "command": "npx",
  "args": ["-y", "@amplify-studio/open-mcp@latest"],
  "env": {
    "GATEWAY_URL": "https://your-gateway-instance.com"
  }
}'
```

## 贡献

我们欢迎贡献！请遵循以下准则：

- Fork 仓库
- 创建功能分支
- 进行更改
- 提交 pull request

### 编码标准

- 使用严格类型安全的 TypeScript
- 遵循现有的错误处理模式
- 编写简洁、信息丰富的错误消息
- 为新功能包含单元测试
- 保持 90% 以上的测试覆盖率

## 许可证

MIT 许可证 - 详情见 [LICENSE](../LICENSE)。

## 致谢

本项目是 [mcp-searxng](https://github.com/ihor-sokoliuk/mcp-searxng)（作者 [Ihor Sokoliuk](https://github.com/ihor-sokoliuk)）的衍生版本，进行了适配和增强，添加了额外的功能和改进。

### 核心依赖

本项目构建于以下优秀的开源项目之上：

| 项目 | 用途 | 许可证 |
|---------|---------------|-----------------|
| [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) | 官方 MCP TypeScript SDK | MIT |
| [node-html-markdown](https://github.com/crosstype/node-html-markdown) | HTML 到 Markdown 转换 | MIT |
| [undici](https://github.com/nodejs/undici) | 支持代理的 HTTP 客户端 | MIT |
| [express](https://github.com/expressjs/express) | HTTP 服务器框架 | MIT |
| [cors](https://github.com/expressjs/cors) | CORS 中间件 | MIT |

### 相关项目

特别感谢以下优秀项目：

- [mcp-searxng](https://github.com/ihor-sokoliuk/mcp-searxng) - 我们 fork 的原始项目，由 [Ihor Sokoliuk](https://github.com/ihor-sokoliuk) 创建
- [Model Context Protocol](https://modelcontextprotocol.io/) - 官方 MCP 文档
- [SearXNG](https://searxng.org/) - 尊重隐私的元搜索引擎
- [Firecrawl](https://www.firecrawl.dev/) - 网页抓取和爬取 API

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=amplify-studio/open-mcp&type=Date)](https://star-history.com/#amplify-studio/open-mcp&Date)

---

**由 [Amplify Studio](https://github.com/amplify-studio) 用 ❤️ 制作**
