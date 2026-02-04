# Open MCP Search Server

[![npm 版本](https://badge.fury.io/js/%40amplify-studio%2Fopen-mcp.svg)](https://www.npmjs.com/package/@amplify-studio/open-mcp)
[![npm 下载量](https://img.shields.io/npm/dm/@amplify-studio/open-mcp)](https://www.npmjs.com/package/@amplify-studio/open-mcp)
[![Docker 拉取量](https://img.shields.io/docker/pulls/amplifystudio/open-mcp)](https://hub.docker.com/r/amplifystudio/open-mcp)
[![许可证: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub 星标](https://img.shields.io/github/stars/amplify-studio/open-mcp?style=social)](https://github.com/amplify-studio/open-mcp)

想找免费的搜索和页面读取服务？想要更好的 MCP 接入？来试试这个项目吧！

**语言：** [English](../README.md) | [中文](README.md)

一键部署您自己的本地搜索和页面读取服务。由 SearXNG 和 Firecrawl 提供支持，通过 MCP 协议与 Claude 集成。

Deploy your own local web search and page reading service in one click. Powered by SearXNG and Firecrawl, integrated with Claude via MCP protocol.

## 功能特性

### MCP 工具 / MCP Tools

通过 MCP 协议提供给 AI 助手的工具：

- 🔍 **网络搜索** - 支持分页、时间过滤、语言选择的网络搜索
- 📄 **URL 读取** - 将网页内容提取为 markdown，支持高级过滤
- 🎨 **图像理解** - 使用智谱 AI 分析图像、视频和文档
- 🖼️ **图像生成** - 使用智谱 AI 从文本生成图像

### 服务器特性 / Server Features

部署和性能相关的基础设施功能：

- 💾 **智能缓存** - 自动缓存，TTL 过期机制提高性能
- 🔄 **双传输模式** - 支持 STDIO 或 HTTP 模式灵活部署
- ⏱️ **自动清理** - 3分钟无活动自动关闭，防止僵尸进程

---

## 兼容客户端

兼容任何 MCP 客户端：

- **Claude Desktop** / **Claude Code** / **Cursor** / **Cline**
- **Continue.dev**
- **HTTP 模式**（用于远程部署）

---

## 快速开始

### 前置条件

使用本 MCP 服务器前，您需要：

1. **运行中的 Gateway API 实例**，包含 SearXNG 和 Firecrawl
   - 部署您自己的 Gateway 或使用托管服务
   - 获取您的 Gateway URL（例如：`http://your-gateway.com:80`）

2. **（可选）智谱 AI API 密钥**用于图像功能
   - 参见下方的[获取智谱 AI API 密钥](#获取智谱-api-密钥)

### 部署 Gateway

本 MCP 服务器需要 Gateway API 实例。您可以使用 Docker Compose 部署您自己的 Gateway：

**快速开始：**

```bash
# 克隆仓库（如果还没有）
git clone https://github.com/amplify-studio/open-mcp.git
cd open-mcp

# 启动 Gateway 服务
docker compose --env-file .env up -d

# 验证服务是否运行
curl http://localhost:80/health
```

**包含的服务：**

Gateway 包含 7 个协同工作的服务：

| 服务 | 用途 | 端口 |
|---------|---------|------|
| **SearXNG** | 尊重隐私的元搜索引擎 | 8888（内部） |
| **Firecrawl API** | 网页抓取和爬取 | 3002（内部） |
| **Playwright** | 浏览器自动化（动态内容） | 3000（内部） |
| **Reader Adapter** | Jina Reader 兼容 API | 8082（内部） |
| **Redis** | 速率限制和缓存 | 6379（内部） |
| **PostgreSQL** | 数据持久化 | 5432（内部） |
| **Nginx** | API 网关（公共端点） | **80** |

**API 端点（通过 Nginx 在 80 端口）：**

- 🔍 **搜索：** `http://localhost:80/api/search/`
- 📄 **读取 URL：** `http://localhost:80/api/read/<url>`
- 📊 **状态：** `http://localhost:80/api/status`

**管理命令：**

```bash
# 查看日志
docker compose logs -f

# 停止服务
docker compose down

# 重启服务
docker compose restart
```

详细配置请参阅 [docker-compose.yml](../docker-compose.yml) 和 [.env.example](../.env.example)。

### 基本使用

添加到 Claude Desktop 配置文件（`claude_desktop_config.json`）：

```json
{
  "mcpServers": {
    "open-mcp": {
      "command": "npx",
      "args": ["-y", "@amplify-studio/open-mcp@latest"],
      "env": {
        "GATEWAY_URL": "http://your-gateway.com:80",
        "ZHIPUAI_API_KEY": "your-zhipu-api-key"
      }
    }
  }
}
```

**替换以下值：**
- `http://your-gateway.com:80` 替换为您的实际 Gateway URL（**必需**）
- `your-zhipu-api-key` 替换为您的智谱 AI API 密钥（**可选** - 仅在需要图像功能时必需）

---

### 配置文件方式（Claude Desktop）

**仅 AI 模式：**
```json
{
  "mcpServers": {
    "open-mcp": {
      "command": "npx",
      "args": ["-y", "@amplify-studio/open-mcp@latest"],
      "env": {
        "ZHIPUAI_API_KEY": "your-zhipu-api-key"
      }
    }
  }
}
```

**全功能模式：**
```json
{
  "mcpServers": {
    "open-mcp": {
      "command": "npx",
      "args": ["-y", "@amplify-studio/open-mcp@latest"],
      "env": {
        "GATEWAY_URL": "http://your-gateway.com:80",
        "ZHIPUAI_API_KEY": "your-zhipu-api-key"
      }
    }
  }
}
```

**替换以下值：**
- `http://your-gateway.com:80` 替换为您的实际 Gateway URL
- `your-zhipu-api-key` 替换为您的智谱 AI API 密钥

**注意：** 工具会根据配置的环境变量自动启用。您只需配置需要使用的功能！

---

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

### 图片理解工具 / Image Understanding Tool

**工具名称：** `image_understand`

**参数：**
- `files` (array, required): 文件路径、URL 或 base64 数据
- `prompt` (string, required): 问题或指令
- `thinking` (boolean, optional): 启用深度思考模式

**示例：**

```json
{
  "files": ["/path/to/image.png"],
  "prompt": "这张图片里有什么物体？",
  "thinking": false
}
```

**响应：** 文本描述或答案

### 图片生成工具 / Image Generation Tool

**工具名称：** `image_generate`

**参数：**
- `prompt` (string, required): 图片描述
- `size` (string, optional): 图片大小（默认："1024x1024"）

**示例：**

```json
{
  "prompt": "山上美丽的日落",
  "size": "1024x1024"
}
```

**响应：** 图片 URL

---

## 功能展示

### 图像理解示例

我们的图像理解功能由智谱 AI GLM-4.6V-Flash 驱动，可以准确分析图片、视频和文档内容。

**原图输入：**

![需要理解的图片](../docs/assets/images/image-to-understand.png)

**AI 理解结果：**

![图像理解结果](../docs/assets/images/image-understand-result.png)

如需了解更多图像功能详情，请查看 [图像 AI 工具文档](../docs/features/image-ai-tools.md)

---

## 配置

### 灵活配置

MCP 服务器会根据您的环境变量自动检测启用的功能。您只需配置需要使用的部分！

#### 配置模式

| 模式 | 环境变量 | 可用工具 | 需要 Docker |
|------|----------|----------|-----------|
| **仅 AI** | 仅 `ZHIPUAI_API_KEY` | `image_understand`、`image_generate` | ❌ 不需要 |
| **仅搜索** | 仅 `GATEWAY_URL` | `searxng_web_search`、`web_url_read` | ✅ 需要 |
| **全功能** | 两个变量都有 | 全部 4 个工具 | ✅ 需要 |

#### 环境变量

| 变量 | 是否必需 | 说明 |
|------|----------|------|
| `GATEWAY_URL` | 可选 | Gateway API URL（例如：`http://your-gateway.com:80`）。仅在需要搜索和 URL 读取功能时必需。 |
| `ZHIPUAI_API_KEY` | 可选 | 您的智谱 AI API 密钥。仅在需要图像理解和生成功能时必需。 |

**注意：** 两个变量都不是严格必需的。服务器会自动启用您已配置依赖项对应的工具。

**需要高级配置？** 参阅 [高级设置指南](../docs/advanced-setup.md) 了解代理、认证和 HTTP 传输选项。

### 获取智谱 AI API 密钥

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
claude mcp remove open-mcp

# 安装最新版本
claude mcp add-json -s user open-mcp '{
  "command": "npx",
  "args": ["-y", "@amplify-studio/open-mcp@latest"],
  "env": {
    "GATEWAY_URL": "https://your-gateway-instance.com",
    "ZHIPUAI_API_KEY": "your-zhipu-api-key"
  }
}'
```

### 清除 npx 缓存

如果更新后遇到问题：

```bash
npm cache clean --force
claude mcp remove open-mcp
claude mcp add-json -s user open-mcp '{
  "command": "npx",
  "args": ["-y", "@amplify-studio/open-mcp@latest"],
  "env": {
    "GATEWAY_URL": "https://your-gateway-instance.com",
    "ZHIPUAI_API_KEY": "your-zhipu-api-key"
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
---

### 技术支持

| 功能 | 技术栈 |
|---------|------------|
| **搜索** | [SearXNG](https://searxng.org/) - 尊重隐私的元搜索引擎 |
| **网页抓取** | [Firecrawl](https://www.firecrawl.dev/) - 网页抓取 API |
| **图像 AI** | [智谱 AI](https://open.bigmodel.cn/) - 免费视觉模型 |
| **协议** | [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) - 官方实现 |

