#!/usr/bin/env node

// Test MCP server functionality
import { performWebSearch } from './dist/search.js';
import { fetchAndConvertToMarkdown } from './dist/url-reader.js';

// Mock server for logging
const mockServer = {
  log() {
    // Mock log function
  }
};

async function testSearch() {
  console.log('\n🔍 Testing Web Search...');
  try {
    const result = await performWebSearch(
      mockServer,
      'test',
      1,
      undefined,
      'all',
      undefined
    );
    console.log('✅ Search result:', result.substring(0, 200) + '...');
    return true;
  } catch (error) {
    console.error('❌ Search failed:', error.message);
    return false;
  }
}

async function testURLRead() {
  console.log('\n📄 Testing URL Read...');
  try {
    const result = await fetchAndConvertToMarkdown(
      mockServer,
      'https://example.com',
      10000,
      {}
    );
    console.log('✅ URL read result:', result.substring(0, 200) + '...');
    return true;
  } catch (error) {
    console.error('❌ URL read failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing Open MCP Server\n');
  console.log('Gateway:', process.env.GATEWAY_URL || 'http://115.190.91.253:80 (default)');

  const searchOk = await testSearch();
  const readOk = await testURLRead();

  console.log('\n' + '='.repeat(50));
  if (searchOk && readOk) {
    console.log('✨ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

main().catch(console.error);
