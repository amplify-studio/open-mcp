# Open MCP + Firecrawl 集成说明

## 📋 总结

经过测试，**将 Firecrawl 完全集成到 open-mcp 项目中比较复杂**，因为 Firecrawl 需要完整的依赖环境（PostgreSQL 特定架构、Redis、RabbitMQ、Playwright 等）。

## ✅ 推荐方案：使用已验证的配置

### 方案 1: 使用 docker-compose-with-mcp.yaml（已验证）

```bash
cd /root/app/firecrawl
docker compose -f docker-compose-with-mcp.yaml up -d
```

**包含服务**：
- ✅ Firecrawl API (3002)
- ✅ Firecrawl Reader Adapter (8082) - 替代 mcp-reader
- ✅ SearXNG (8888)
- ✅ 原 MCP Reader (8080) - 保留
- ✅ 所有依赖服务

### 方案 2: 使用外部 Firecrawl API

如果你已经在其他地方部署了 Firecrawl，可以在 open-mcp 中使用它：

#### 1. 部署 open-mcp（不含 Firecrawl）

```bash
cd /root/app/open-mcp
docker compose up -d
```

#### 2. 添加 Firecrawl Reader Adapter（指向外部 API）

创建 `services/firecrawl-adapter/.env`:

```bash
FIRECRAWL_API_URL=http://your-firecrawl-host:3002
FIRECRAWL_API_KEY=your_api_key_if_needed
PORT=8082
```

然后更新 `docker-compose.yml`:

```yaml
services:
  # ... 其他服务

  firecrawl-adapter:
    build:
      context: ./services/firecrawl-adapter
      dockerfile: Dockerfile
    container_name: firecrawl-adapter
    restart: unless-stopped
    env_file:
      - ./services/firecrawl-adapter/.env
    ports:
      - "8082:8082"
    networks:
      - mcp-network
```

## ❌ 为什么不推荐完全集成

### Firecrawl 依赖复杂

Firecrawl 需要：

1. **PostgreSQL** (带特定表结构)
   - 需要 nuq.sql 初始化脚本
   - 不能使用标准 PostgreSQL 镜像

2. **Redis**
   - 用于缓存和队列

3. **RabbitMQ**
   - 用于任务队列管理

4. **Playwright Service**
   - 用于浏览器自动化
   - 需要大量资源

5. **API + Workers**
   - API 服务器
   - 5 个 NuQ workers
   - Extract worker

### 资源占用

| 配置 | 服务数 | 内存占用 |
|------|--------|---------|
| 仅 open-mcp | 3 个 | ~500MB |
| open-mcp + Firecrawl | 9 个 | ~2GB |

## 🎯 实际建议

### 开发环境

使用已验证的 `docker-compose-with-mcp.yaml`：

```bash
cd /root/app/firecrawl
docker compose -f docker-compose-with-mcp.yaml up -d
```

### 生产环境

#### 选项 A: 独立部署（推荐）

1. **部署 Firecrawl**（单独服务器或容器组）
   ```bash
   cd /root/app/firecrawl
   docker compose up -d
   ```

2. **部署 open-mcp**（单独服务器或容器组）
   ```bash
   cd /root/app/open-mcp
   docker compose up -d
   ```

3. **配置 Nginx 反向代理**，统一入口

#### 选项 B: 使用托管服务

使用 Firecrawl Cloud 托管服务，只需在 open-mcp 中配置 API Key。

## 📝 配置示例

### 使用外部 Firecrawl

如果你选择部署独立的 Firecrawl，可以这样配置：

#### 1. Firecrawl 部署（服务器 A）

```bash
# /root/app/firecrawl/docker-compose.yaml
services:
  api:
    image: ghcr.io/firecrawl/firecrawl:latest
    ports:
      - "3002:3002"
    # ... 其他配置
```

#### 2. Open MCP 部署（服务器 B）

```bash
# /root/app/open-mcp/docker-compose.yml
services:
  searxng:
    # ... SearXNG 配置

  reader:
    # ... Reader 配置

  nginx:
    # ... Nginx 配置
```

#### 3. 添加 Firecrawl Adapter

在 open-mcp 中添加适配器服务，指向外部 Firecrawl：

```yaml
services:
  firecrawl-adapter:
    image: firecrawl-adapter:latest
    environment:
      FIRECRAWL_API_URL: http://firecrawl-server:3002
    ports:
      - "8082:8082"
```

## 🔗 服务访问

### 当前运行的服务（已验证）

```
Firecrawl API:          http://localhost:3002
Firecrawl Reader:       http://localhost:8082  ⭐ 推荐使用
SearXNG:                http://localhost:8888
MCP Reader (原):        http://localhost:8080
```

### 使用示例

```bash
# 1. 使用 Firecrawl Reader (推荐)
curl "http://localhost:8082/api/read/http://example.com"

# 2. 使用 Firecrawl API
curl -X POST http://localhost:3002/v1/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# 3. 使用 SearXNG
curl "http://localhost:8888/search?q=test"

# 4. 使用原 MCP Reader
curl "http://localhost:8080/http://example.com"
```

## 📊 架构对比

### 原 open-mcp

```
用户 → Nginx (3333)
              ├─→ SearXNG (8888)
              ├─→ Reader (8080)
              └─→ (外部服务)
```

### 推荐：Firecrawl + open-mcp 集成

```
用户 → Nginx (3333)
              ├─→ SearXNG (8888)
              ├─→ Firecrawl Reader (8082) ⭐ 新增
              │        ↓
              │    Firecrawl API (3002)
              │        ↓
              │    Playwright + PostgreSQL + Redis
              │
              └─→ Reader (8080) (保留兼容)
```

## 🚀 快速开始

### 一键启动（推荐）

```bash
# 进入 Firecrawl 项目
cd /root/app/firecrawl

# 启动集成服务
docker compose -f docker-compose-with-mcp.yaml up -d

# 等待服务启动
sleep 30

# 测试
curl "http://localhost:8082/api/read/http://example.com"
```

## 📚 相关文件

- `/root/app/firecrawl/docker-compose-with-mcp.yaml` - 集成配置
- `/root/app/firecrawl/firecrawl-reader-adapter/` - Reader 适配器
- `/root/app/open-mcp/` - 原 Open MCP 项目

## ⚠️ 注意事项

1. **数据库初始化**：Firecrawl 需要特定的数据库架构，不能简单使用标准 PostgreSQL

2. **资源需求**：Firecrawl + open-mcp 需要至少 4GB 内存

3. **网络配置**：确保所有服务在同一 Docker 网络

4. **端口冲突**：如果端口冲突，修改 docker-compose 文件中的端口映射

## 🎉 结论

**已验证可用的配置**位于 `/root/app/firecrawl/docker-compose-with-mcp.yaml`，包含：
- ✅ 完整的 Firecrawl 服务（6个）
- ✅ Open MCP 服务（3个）
- ✅ Firecrawl Reader Adapter（新增）
- ✅ 所有测试通过

使用这个配置，你无需担心集成问题！
