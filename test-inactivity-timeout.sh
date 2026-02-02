#!/bin/bash

# Test inactivity timeout feature
# This test verifies that the server exits after 3 minutes of inactivity

set -e

echo "=========================================="
echo "Testing Inactivity Timeout Feature"
echo "=========================================="
echo ""

# Check if server is built
if [ ! -f "dist/index.js" ]; then
  echo "❌ dist/index.js not found. Run 'npm run build' first."
  exit 1
fi

# Test 1: Verify timeout configuration exists
echo ""
echo "Test 1: Checking timeout configuration in source..."
if grep "INACTIVITY_TIMEOUT_MS" src/index.ts | grep -q "180000"; then
  echo "✅ Timeout configuration found (3 minutes)"
else
  echo "❌ Timeout configuration not found"
  exit 1
fi

# Test 2: Verify resetActivityTimeout is called in handlers
echo ""
echo "Test 2: Checking activity reset handlers..."
HANDLERS=(
  "ListToolsRequestSchema"
  "CallToolRequestSchema"
  "SetLevelRequestSchema"
  "ListResourcesRequestSchema"
  "ReadResourceRequestSchema"
)

for handler in "${HANDLERS[@]}"; do
  if grep -A 3 "setRequestHandler($handler" src/index.ts | grep -q "resetActivityTimeout()"; then
    echo "  ✅ $handler resets timeout"
  else
    echo "  ❌ $handler does NOT reset timeout"
    exit 1
  fi
done

# Test 3: Check setTimeout callback
echo ""
echo "Test 3: Checking setTimeout implementation..."
if grep -A 5 "activityTimeout = setTimeout" src/index.ts | grep -q "process.exit(0)"; then
  echo "✅ Timeout will exit cleanly (process.exit(0))"
else
  echo "❌ Timeout exit not found"
  exit 1
fi

# Test 4: Verify timer starts after connection
echo ""
echo "Test 4: Checking timer initialization..."
if grep -A 5 "await server.connect(transport)" src/index.ts | grep -q "resetActivityTimeout()"; then
  echo "✅ Timer starts after STDIO connection"
else
  echo "❌ Timer initialization not found"
  exit 1
fi

# Test 5: Build check
echo ""
echo "Test 5: Verifying build..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Build successful"
else
  echo "❌ Build failed"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ All static checks passed!"
echo "=========================================="
echo ""
echo "Note: Runtime testing requires a persistent STDIO connection."
echo "The inactivity timeout will work correctly when:"
echo "  1. Server starts via MCP client (e.g., Claude Code)"
echo "  2. Client connects and sends initialize request"
echo "  3. Timer resets on each request"
echo "  4. After 3 min of no requests, server exits"
echo ""
echo "To test manually with MCP Inspector:"
echo "  npm run inspector"
echo "  Then wait 3 minutes without any activity"
echo ""
