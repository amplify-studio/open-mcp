# SearXNG 服务 Dockerfile - 一键部署版本
FROM python:3.12-slim

LABEL maintainer="MCP Services"
LABEL description="SearXNG metasearch engine - auto clone version"

WORKDIR /usr/local/searxng

# 安装系统依赖（包括 git）
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    libxml2-dev \
    libxslt-dev \
    libffi-dev \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# 克隆 SearXNG 源码
ARG SEARXNG_VERSION="master"
RUN git clone --depth 1 --branch ${SEARXNG_VERSION} https://github.com/searxng/searxng.git /tmp/searxng && \
    cp -r /tmp/searxng/searx /usr/local/searxng/ && \
    cp /tmp/searxng/requirements.txt /tmp/searxng/requirements-server.txt . && \
    rm -rf /tmp/searxng

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt -r requirements-server.txt

# 创建数据目录
RUN mkdir -p /etc/searxng /var/log/uwsgi

# 设置 PYTHONPATH
ENV PYTHONPATH=/usr/local/searxng:$PYTHONPATH

# 创建 version_frozen.py
RUN echo "VERSION_STRING = \"1.0.0\"" > /usr/local/searxng/searx/version_frozen.py && \
    echo "VERSION_TAG = \"1.0.0\"" >> /usr/local/searxng/searx/version_frozen.py && \
    echo "DOCKER_TAG = \"1.0.0\"" >> /usr/local/searxng/searx/version_frozen.py && \
    echo "GIT_URL = \"https://github.com/searxng/searxng\"" >> /usr/local/searxng/searx/version_frozen.py && \
    echo "GIT_BRANCH = \"master\"" >> /usr/local/searxng/searx/version_frozen.py

# 暴露端口
EXPOSE 8888

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8888/search?q=test', timeout=3)" || exit 1

# 启动服务
CMD ["python", "searx/webapp.py"]
