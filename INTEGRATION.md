# Open MCP + Firecrawl 集成部署指南

本项目将 Firecrawl 网页抓取服务集成到 Open MCP 项目中。

## 🚀 快速开始

### 方法 1: 使用集成配置（推荐）

```bash
cd /root/app/open-mcp

# 启动所有服务（包括 Firecrawl）
docker compose -f docker-compose-with-firecrawl.yml up -d

# 查看状态
docker compose -f docker-compose-with-firecrawl.yml ps

# 查看日志
docker compose -f docker-compose-with-firecrawl.yml logs -f
```

### 方法 2: 仅使用原 Open MCP 服务

```bash
cd /root/app/open-mcp

# 仅启动 MCP 服务（不含 Firecrawl）
docker compose up -d
```

## 📊 服务说明

### 新增服务

| 服务 | 端口 | 说明 |
|------|------|------|
| **Firecrawl API** | 3002 | 网页抓取 API，支持动态内容 |
| **Firecrawl Adapter** | 8082 | Reader 适配器，兼容 Jina API 格式 |

### 原有服务

| 服务 | 端口 | 说明 |
|------|------|------|
| **SearXNG** | 8888 | 元搜索引擎 |
| **Reader** | 8080 | 原内容提取服务（保留） |
| **Nginx** | 3333 | API 网关 |

## 🔗 使用示例

### 1. 使用 Firecrawl Reader Adapter (推荐)

```bash
# Jina 兼容格式（GET）
curl "http://localhost:8082/api/read/http://example.com"

# JSON 格式（POST）
curl -X POST http://localhost:8082/api/read \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### 2. 使用 Firecrawl API

```bash
# 单页抓取
curl -X POST http://localhost:3002/v1/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# 批量抓取
curl -X POST http://localhost:3002/v1/batch/scrape \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com", "https://httpbin.org"]}'

# 网站地图
curl -X POST http://localhost:3002/v1/map \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### 3. 使用 SearXNG 搜索

```bash
curl "http://localhost:8888/search?q=firecrawl&format=json"
```

### 4. 使用原 Reader 服务

```bash
curl "http://localhost:8080/http://example.com"
```

## ⚙️ 配置说明

### 环境变量

创建 `.env` 文件（可选）：

```bash
# Firecrawl API Key（如果需要）
FIRECRAWL_API_KEY=your_api_key_here

# Redis（可选，用于缓存）
REDIS_URL=redis://localhost:6379

# SearXNG 端点（已自动配置）
SEARXNG_ENDPOINT=http://searxng:8888
```

### 资源限制

在 `docker-compose-with-firecrawl.yml` 中已配置：

- Firecrawl API: 1.5 CPU, 4GB 内存
- 其他服务: 默认限制

可根据需要调整：

```yaml
services:
  firecrawl:
    cpus: 2.0          # 增加 CPU
    mem_limit: 6G      # 增加内存
```

## 🆚 对比

### 原 Open MCP (docker-compose.yml)

- ✅ SearXNG 搜索
- ✅ Reader 内容提取
- ✅ Nginx 网关
- ❌ 不支持动态内容
- ❌ 功能有限

### Open MCP + Firecrawl (docker-compose-with-firecrawl.yml)

- ✅ 所有原功能
- ✅ **动态内容抓取**（Playwright）
- ✅ **批量抓取**
- ✅ **网站地图**
- ✅ **深度爬取**
- ✅ **更好的 Markdown 转换**

## 🧪 测试

```bash
# 运行测试
cd /root/app/open-mcp

# 测试 Firecrawl API
curl http://localhost:3002/

# 测试 Firecrawl Adapter
curl "http://localhost:8082/api/read/http://example.com"

# 测试 SearXNG
curl "http://localhost:8888/search?q=test"

# 测试原 Reader
curl "http://localhost:8080/http://example.com"
```

## 📝 管理命令

```bash
# 查看服务状态
docker compose -f docker-compose-with-firecrawl.yml ps

# 查看日志
docker compose -f docker-compose-with-firecrawl.yml logs -f firecrawl
docker compose -f docker-compose-with-firecrawl.yml logs -f firecrawl-adapter

# 重启服务
docker compose -f docker-compose-with-firecrawl.yml restart firecrawl

# 停止所有服务
docker compose -f docker-compose-with-firecrawl.yml down

# 停止并删除数据
docker compose -f docker-compose-with-firecrawl.yml down -v
```

## 🔧 故障排除

### Firecrawl 无法启动

1. 检查端口占用：
```bash
netstat -tlnp | grep 3002
```

2. 查看日志：
```bash
docker compose -f docker-compose-with-firecrawl.yml logs firecrawl
```

3. 检查资源：
```bash
docker stats
```

### Adapter 无法连接 Firecrawl

1. 检查网络：
```bash
docker network ls
docker network inspect open-mcp_mcp-network
```

2. 测试连接：
```bash
docker exec firecrawl-adapter curl http://firecrawl:3002/
```

## 📚 相关文档

- [Firecrawl 官方文档](https://docs.firecrawl.dev)
- [Open MCP README](./README.md)
- [Firecrawl Adapter 说明](./services/firecrawl-adapter/README.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT
