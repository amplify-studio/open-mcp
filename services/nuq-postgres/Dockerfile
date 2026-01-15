# Build a Postgres image that runs nuq.sql during initdb
# Use SWR (Huawei Cloud) China mirror for Postgres image

ARG PG_MAJOR=17
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/postgres:${PG_MAJOR}

# Use Debian China mirror (optional, for apt packages)
RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || true

# Copy nuq.sql so it is executed as part of the initdb sequence
COPY nuq.sql /docker-entrypoint-initdb.d/010-nuq.sql