# Docker Compose 部署指南

本文档介绍如何使用 Docker Compose 部署 open-mcp 服务栈。

## 服务架构

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (Gateway)  │
                    │   Port 3333 │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
    ┌───────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
    │   SearXNG    │ │  Reader   │ │           │
    │  Port 8888   │ │ Port 8080 │ │  External │
    └──────────────┘ └───────────┘ │ Services  │
                                    └───────────┘
```

## 快速开始

### 1. 克隆仓库并准备环境

```bash
git clone https://github.com/amplify-studio/open-mcp.git
cd open-mcp
```

### 2. 配置环境变量（可选）

```bash
cp .env.example .env
# 编辑 .env 文件配置你的环境变量
```

### 3. 启动服务

```bash
docker-compose up -d
```

### 4. 验证服务

```bash
# 检查服务状态
docker-compose ps

# 测试健康检查
curl http://localhost:3333/health

# 测试搜索 API
curl "http://localhost:3333/api/search/?q=test&format=json"

# 测试读取 API
curl "http://localhost:3333/api/read/https://example.com"
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/search/` | GET | SearXNG 搜索 |
| `/api/read/{url}` | GET | 网页内容提取 |
| `/api/jina-search/{query}` | GET | Jina 搜索代理 |
| `/api/status` | GET | 服务状态 |

## 高级配置

### SearXNG 配置

编辑 `config/nginx/searxng-settings.yml` 自定义搜索引擎设置。

### Nginx 配置

编辑 `config/nginx/nginx.conf` 和 `config/nginx/sites-enabled/mcp-services` 调整网关配置。

### 环境变量

复制 `.env.example` 到 `.env` 并配置：

```bash
# SearXNG 配置
SEARXNG_SECRET=your-secret-key

# Nginx 配置
NGINX_PORT=3333
```

## 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 重新构建镜像
docker-compose build

# 清理所有数据（包括 volumes）
docker-compose down -v
```

## 故障排查

### 服务无法启动

```bash
# 查看服务日志
docker-compose logs <service-name>

# 检查端口占用
netstat -tulpn | grep -E '8888|8080|3333'
```

### SearXNG 搜索无结果

检查 `config/nginx/searxng-settings.yml` 中搜索引擎是否启用。

### Reader 服务超时

Nginx 配置中已设置 120s 超时，如需调整编辑 `config/nginx/sites-enabled/mcp-services`。

## 生产部署建议

1. 使用外部 SearXNG 实例而非容器
2. 配置 HTTPS（使用 Let's Encrypt + Nginx）
3. 启用日志持久化
4. 配置监控和告警
5. 使用 Docker secrets 管理敏感信息

## License

MIT

## Support

- Issues: https://github.com/amplify-studio/open-mcp/issues
- Discussions: https://github.com/amplify-studio/open-mcp/discussions
