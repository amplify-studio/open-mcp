# Firecrawl Reader Adapter

用 Firecrawl 替换 Jina Reader 的适配器服务。

## 功能

将 Jina Reader 兼容的 GET 请求转换为 Firecrawl API 的 POST 请求。

## API 兼容性

### GET 方式（Jina Reader 格式）

```bash
curl "http://localhost:8082/api/read/http://example.com"
```

返回纯文本 Markdown。

### POST 方式

```bash
curl -X POST http://localhost:8082/api/read \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|-------|------|
| `FIRECRAWL_API_URL` | `http://firecrawl-api-test:3002` | Firecrawl API 地址 |
| `FIRECRAWL_API_KEY` | (空) | API Key（可选） |
| `PORT` | `8082` | 服务端口 |

## 快速开始

```bash
# 构建
docker build -t firecrawl-reader-adapter .

# 运行
docker run -d --name firecrawl-reader-adapter \
  --network backend \
  -e FIRECRAWL_API_URL=http://api:3002 \
  -p 8082:8082 \
  firecrawl-reader-adapter

# 测试
curl "http://localhost:8082/api/read/http://example.com"
```

## 数据转换流程

```
用户请求: GET /api/read/http://example.com
    ↓
Adapter 解码 URL
    ↓
调用: POST http://api:3002/v1/scrape {"url": "..."}
    ↓
提取: response.data.markdown
    ↓
返回: 纯文本 Markdown (兼容 Jina)
```

## 完整文档

详见: `/root/app/firecrawl/FIRECRAWL_REPLACEMENT_GUIDE.md`
