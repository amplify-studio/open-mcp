#!/usr/bin/env node

/**
 * Test to verify Initialize response is correct
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Testing Initialize response...\n');

// Start the MCP server
const server = spawn('node', ['dist/index.js'], {
  cwd: process.cwd(),
  env: { ...process.env, GATEWAY_URL: 'http://localhost' }
});

let responseData = '';
let errorData = '';

server.stdout.on('data', (data) => {
  const output = data.toString();
  responseData += output;

  // Try to parse JSON-RPC response
  const lines = output.split('\n').filter(line => line.trim().startsWith('{'));
  for (const line of lines) {
    try {
      const response = JSON.parse(line);
      if (response.id === 1 && response.result) {
        console.log('✅ Received Initialize response:');
        console.log(JSON.stringify(response.result, null, 2));

        // Check if response has required fields
        if (response.result.protocolVersion) {
          console.log('\n✅ protocolVersion present:', response.result.protocolVersion);
        } else {
          console.log('\n❌ protocolVersion MISSING!');
        }

        if (response.result.capabilities) {
          console.log('✅ capabilities present:', JSON.stringify(response.result.capabilities));
        } else {
          console.log('❌ capabilities MISSING!');
        }

        if (response.result.serverInfo) {
          console.log('✅ serverInfo present:', response.result.serverInfo);
        } else {
          console.log('❌ serverInfo MISSING!');
        }

        // Give it a moment then exit
        setTimeout(() => {
          server.kill();
          process.exit(0);
        }, 100);
      }
    } catch (e) {
      // Not JSON, ignore
    }
  }
});

server.stderr.on('data', (data) => {
  errorData += data.toString();
  process.stderr.write('[Server ERR]: ' + data.toString());
});

server.on('close', (code) => {
  console.log(`\n[Server EXIT]: code ${code}`);
  process.exit(code);
});

// Send Initialize request after a short delay
setTimeout(() => {
  console.log('[Client REQ]: Sending Initialize request...\n');
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  };
  server.stdin.write(JSON.stringify(request) + '\n');
}, 500);

// Timeout after 5 seconds
setTimeout(() => {
  console.error('\n❌ Test timed out');
  server.kill();
  process.exit(1);
}, 5000);
