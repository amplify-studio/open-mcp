# Advanced Setup Guide

This guide covers advanced configuration options for Open MCP Server.

## Table of Contents

- [Authentication](#authentication)
- [Proxy Configuration](#proxy-configuration)
- [HTTP Transport Mode](#http-transport-mode)
- [Custom User Agent](#custom-user-agent)
- [Troubleshooting](#troubleshooting)

---

## Authentication

If your Gateway API requires HTTP Basic Authentication, configure these environment variables:

### Configuration

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

**Important**: Both `AUTH_USERNAME` and `AUTH_PASSWORD` must be set together. Setting only one will cause a configuration error.

---

## Proxy Configuration

If you need to access the Gateway through a proxy server, configure these environment variables:

### HTTP/HTTPS Proxy

```json
{
  "env": {
    "GATEWAY_URL": "http://gateway.com",
    "HTTP_PROXY": "http://proxy.example.com:8080",
    "HTTPS_PROXY": "http://proxy.example.com:8080"
  }
}
```

### Proxy with Authentication

```json
{
  "env": {
    "HTTP_PROXY": "http://username:password@proxy.example.com:8080"
  }
}
```

### Bypass Proxy for Certain Hosts

Use `NO_PROXY` to specify hosts that should be accessed directly:

```json
{
  "env": {
    "HTTP_PROXY": "http://proxy.company.com:8080",
    "NO_PROXY": "localhost,127.0.0.1,.local,.company.com"
  }
}
```

**NO_PROXY Patterns**:
- `localhost` - Bypass localhost
- `127.0.0.1` - Bypass local IP
- `.example.com` - Bypass all subdomains of example.com
- `example.com` - Bypass example.com and its subdomains
- `*` - Bypass all hosts (disable proxy)

---

## HTTP Transport Mode

By default, Open MCP Server uses STDIO transport. For remote deployments or web applications, you can enable HTTP transport.

### Start HTTP Server

Set the `MCP_HTTP_PORT` environment variable:

```bash
MCP_HTTP_PORT=3333 \
GATEWAY_URL=http://your-gateway.com:80 \
npx @amplify-studio/open-mcp@latest
```

The server will start on the specified port and provide:
- **HTTP endpoint**: `http://localhost:3333/mcp`
- **Health check**: `http://localhost:3333/health`

### Connect via Claude Code

```bash
claude mcp add --transport http open-mcp http://localhost:3333/mcp
```

### HTTP vs STDIO

| Feature | STDIO (Default) | HTTP Mode |
|---------|-----------------|-----------|
| Use case | Desktop apps | Remote/web apps |
| Configuration | Simpler | Requires port |
| Performance | Better for local | Better for remote |
| Transport | Standard input/output | HTTP + SSE |

---

## Custom User Agent

Customize the User-Agent header for requests to the Gateway:

```json
{
  "env": {
    "USER_AGENT": "MyBot/1.0 (+https://mywebsite.com/bot)"
  }
}
```

**Note**: Only set this if your Gateway requires a specific User-Agent for identification or rate limiting purposes.

---

## Troubleshooting

### Gateway Connection Issues

**Problem**: "Connection Error" or "DNS Error"

**Solutions**:
1. Verify `GATEWAY_URL` is correct and accessible
2. Check if Gateway service is running
3. If using proxy, verify proxy settings
4. Check firewall rules

### Authentication Failures

**Problem**: "403 Forbidden" or "401 Unauthorized"

**Solutions**:
1. Verify both `AUTH_USERNAME` and `AUTH_PASSWORD` are set
2. Check credentials with Gateway administrator
3. Ensure Gateway is configured for Basic Auth

### Proxy Not Working

**Problem**: Traffic not going through proxy

**Solutions**:
1. Verify proxy URL format: `http://proxy:port` or `http://user:pass@proxy:port`
2. Check `NO_PROXY` doesn't include your Gateway host
3. Ensure proxy supports HTTPS (if using `HTTPS_PROXY`)

### Image Tools Not Working

**Problem**: Image features return errors

**Solutions**:
1. Verify `ZHIPUAI_API_KEY` is set correctly
2. Check API key format: `id.secret`
3. Ensure API key is active (has available quota)
4. Test API key at [Zhipu AI Console](https://www.bigmodel.cn/usercenter/proj-mgmt/apikeys)

---

## Complete Example

Here's a complete example with all advanced options:

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

## Need Help?

- **Issues**: [GitHub Issues](https://github.com/amplify-studio/open-mcp/issues)
- **Documentation**: [Main README](../README.md)
- **MCP Protocol**: [Model Context Protocol Specs](https://modelcontextprotocol.io/)
