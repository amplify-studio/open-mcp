#!/usr/bin/env node

import { performWebSearch } from './dist/search.js';

// Mock server
const mockServer = {
  log() {}
};

async function test() {
  console.log('🧪 Testing Firecrawl Search API...\n');

  try {
    const result = await performWebSearch(mockServer, 'Python教程', 1);
    console.log('✅ Result:');
    console.log(result);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();
