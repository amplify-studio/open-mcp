#!/usr/bin/env node

// Simple test for gateway API
const GATEWAY_URL = process.env.GATEWAY_URL || "http://115.190.91.253:80";

console.log(`\n🧪 Testing Gateway: ${GATEWAY_URL}\n`);

// Test 1: Health check
console.log("1️⃣  Testing /health...");
fetch(`${GATEWAY_URL}/health`)
  .then(r => r.text())
  .then(data => console.log("   ✅ Health:", data))
  .catch(e => console.log("   ❌ Error:", e.message));

// Test 2: Search
console.log("\n2️⃣  Testing /api/search/...");
fetch(`${GATEWAY_URL}/api/search/?q=test&format=json`)
  .then(r => r.json())
  .then(data => console.log(`   ✅ Found ${data.number_of_results} results, first: "${data.results?.[0]?.title}"`))
  .catch(e => console.log("   ❌ Error:", e.message));

// Test 3: URL Read
console.log("\n3️⃣  Testing /api/read/...");
fetch(`${GATEWAY_URL}/api/read/https://example.com`)
  .then(r => r.json())
  .then(data => console.log(`   ✅ Content: "${data.content?.substring(0, 50)}..." (${data.wordCount} words)`))
  .catch(e => console.log("   ❌ Error:", e.message));

console.log("\n✨ Tests complete!\n");
