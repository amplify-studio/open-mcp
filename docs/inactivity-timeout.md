# Inactivity Timeout Feature

## Overview

The MCP server now includes an automatic inactivity timeout feature that prevents zombie processes. The server will automatically shut down after 3 minutes of no client activity.

## How It Works

1. **Timer Starts**: When the server connects to a client (STDIO or HTTP), a 3-minute timer starts
2. **Activity Tracking**: Every MCP request (search, URL reading, resource access, etc.) resets the timer
3. **Auto Shutdown**: If no requests occur within 3 minutes, the server exits cleanly

## Benefits

- ✅ **Prevents Zombie Processes**: Automatically cleans up unused server instances
- ✅ **Resource Management**: Frees up memory and connections when not in use
- ✅ **Clean Shutdown**: Graceful exit with proper logging

## Timer Reset Triggers

The inactivity timer is reset on any MCP request:

- `initialize` - Client initialization
- `tools/list` - List available tools
- `tools/call` - Execute any tool (search, URL reading, image AI)
- `logging/set_level` - Change log level
- `resources/list` - List available resources
- `resources/read` - Read a resource

## Configuration

The timeout duration is configured in `src/index.ts`:

```typescript
const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
```

To change the timeout duration, modify this value and rebuild:

```bash
npm run build
```

## Testing

### Static Verification

Run the automated test:

```bash
./test-inactivity-timeout.sh
```

### Manual Testing

1. Start the server:
   ```bash
   GATEWAY_URL=http://localhost node dist/index.js
   ```

2. Wait 3 minutes without sending any requests

3. Observe the log message and automatic shutdown:
   ```
   No activity for 180s, shutting down
   ```

### Runtime Testing

Use the runtime test script:

```bash
node test-runtime-timeout.js
```

This will:
- Start a persistent STDIO connection
- Send requests every 30 seconds to keep the server alive
- Stop sending requests and verify the server exits after 3 minutes

## Implementation Details

### Code Location

- **Main Logic**: `src/index.ts` lines 211-225
- **Handler Integration**: All MCP request handlers call `resetActivityTimeout()`
- **Timer Initialization**: Started after STDIO/HTTP connection

### Key Function

```typescript
function resetActivityTimeout(): void {
  clearTimeout(activityTimeout);
  activityTimeout = setTimeout(() => {
    logMessage(server, "info", `No activity for ${INACTIVITY_TIMEOUT_MS / 1000}s, shutting down`);
    process.exit(0);
  }, INACTIVITY_TIMEOUT_MS);
}
```

### Shutdown Safety

The timer is properly cleaned up on:
- SIGINT/SIGTERM signals (Ctrl+C)
- STDIO connection close
- HTTP server shutdown

This prevents race conditions during normal shutdown procedures.

## Troubleshooting

### Server Exits Too Soon

If the server exits while you're actively using it:

1. Check if requests are being sent regularly
2. Verify the client is calling MCP tools periodically
3. Consider increasing the timeout if needed

### Server Doesn't Exit

If the server doesn't exit after 3 minutes:

1. Check for background requests keeping it alive
2. Verify the timer is initialized (check logs for "connected via STDIO")
3. Run `./test-inactivity-timeout.sh` to verify installation

## Future Enhancements

Potential improvements for future versions:

- Configurable timeout via environment variable
- Optional timeout disable for debugging
- Warning notifications before timeout
- Metrics reporting for timeout events
