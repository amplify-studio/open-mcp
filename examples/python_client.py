#!/usr/bin/env python3
"""
Open MCP Python Client Example

This example demonstrates how to connect to the Open MCP server
using HTTP transport and call various tools.
"""

import requests
import json
from typing import Any, Dict, List, Optional


class MCPHttpClient:
    """HTTP client for Open MCP server"""

    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session_id: Optional[str] = None
        self.request_id = 0

    def initialize(self) -> Dict[str, Any]:
        """Initialize MCP session"""
        print(f"🔌 Connecting to {self.base_url}")

        response = requests.post(
            f"{self.base_url}/mcp",
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream",
            },
            json={
                "jsonrpc": "2.0",
                "id": self._next_id(),
                "method": "initialize",
                "params": {
                    "protocolVersion": "2025-06-18",
                    "capabilities": {},
                    "clientInfo": {
                        "name": "python-client-example",
                        "version": "1.0.0",
                    },
                },
            },
        )

        # Extract session ID from response headers
        self.session_id = response.headers.get("mcp-session-id")
        if self.session_id:
            print(f"✅ Session established: {self.session_id}")

        data = response.json()
        if "error" in data:
            raise Exception(f"Initialize failed: {data['error']['message']}")

        return data

    def list_tools(self) -> List[Dict[str, Any]]:
        """List available tools"""
        response = self._send_request("tools/list")
        return response.get("result", {}).get("tools", [])

    def call_tool(self, name: str, arguments: Dict[str, Any]) -> Any:
        """Call a tool"""
        response = self._send_request(
            "tools/call",
            {"name": name, "arguments": arguments},
        )
        return response.get("result")

    def list_resources(self) -> List[Dict[str, Any]]:
        """List available resources"""
        response = self._send_request("resources/list")
        return response.get("result", {}).get("resources", [])

    def read_resource(self, uri: str) -> Any:
        """Read a resource"""
        response = self._send_request("resources/read", {"uri": uri})
        return response.get("result")

    def _send_request(self, method: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Send JSON-RPC request"""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        }

        if self.session_id:
            headers["mcp-session-id"] = self.session_id

        payload = {
            "jsonrpc": "2.0",
            "id": self._next_id(),
            "method": method,
        }

        if params:
            payload["params"] = params

        response = requests.post(
            f"{self.base_url}/mcp",
            headers=headers,
            json=payload,
        )

        data = response.json()

        if "error" in data:
            raise Exception(f"Request failed: {data['error']['message']}")

        return data

    def _next_id(self) -> int:
        """Get next request ID"""
        self.request_id += 1
        return self.request_id

    def close(self) -> None:
        """Close connection"""
        print("🔌 Closing connection")


def demo_list_tools(client: MCPHttpClient) -> None:
    """Demonstrate listing tools"""
    print("\n📋 Available Tools:")
    tools = client.list_tools()

    for tool in tools:
        print(f"  • {tool['name']}")
        print(f"    {tool['description']}")


def demo_search(client: MCPHttpClient) -> None:
    """Demonstrate web search"""
    query = input("\n🔍 Enter search query (or press Enter to skip): ")

    if not query.strip():
        print("⏭️  Skipping search")
        return

    print(f"Searching for: {query}")

    result = client.call_tool("searxng_web_search", {"query": query})

    print("\n📊 Search Results:")

    # Parse result content
    content = result.get("content", [{}])[0].get("text", "{}")
    data = json.loads(content)

    if data.get("results"):
        for item in data["results"][:5]:
            print(f"  • {item['title']}")
            print(f"    {item['url']}")
            content_snippet = item.get("content", "")
            if content_snippet:
                print(f"    {content_snippet[:100]}...")
            print()
    else:
        print("  No results found")


def demo_read_url(client: MCPHttpClient) -> None:
    """Demonstrate URL reading"""
    url = input("\n📄 Enter URL to read (or press Enter to skip): ")

    if not url.strip():
        print("⏭️  Skipping URL read")
        return

    print(f"Reading: {url}")

    result = client.call_tool("web_url_read", {"url": url})

    print("\n📖 Content:")
    content = result.get("content", [{}])[0]
    text = content.get("text", "No content")
    print(text[:500])
    if len(text) > 500:
        print("\n... (content truncated)")


def demo_resources(client: MCPHttpClient) -> None:
    """Demonstrate resources"""
    print("\n📚 Available Resources:")
    resources = client.list_resources()

    for resource in resources:
        print(f"  • {resource['name']}")
        print(f"    {resource['uri']}")
        print(f"    {resource['description']}")


def main():
    """Main demo function"""
    import os

    base_url = os.environ.get("MCP_SERVER_URL", "http://localhost:3333/mcp")
    client = MCPHttpClient(base_url)

    try:
        # Initialize
        client.initialize()

        # List available tools
        demo_list_tools(client)

        # Perform search
        demo_search(client)

        # Read URL
        demo_read_url(client)

        # Show resources
        demo_resources(client)

    except Exception as error:
        print(f"❌ Error: {error}")
        exit(1)
    finally:
        client.close()


if __name__ == "__main__":
    main()
