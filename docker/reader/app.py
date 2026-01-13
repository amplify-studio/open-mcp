#!/usr/bin/env python3
"""
MCP Reader Service - Lightweight Web Content Extractor
"""
from flask import Flask, jsonify, request
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
import re

app = Flask(__name__)
PORT = 8080

@app.route('/health')
def health():
    return 'OK'

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>', methods=['GET'])
def read(path):
    """Extract content from URL"""
    if not path or path == 'health':
        return jsonify({
            'service': 'MCP Reader Service',
            'version': '1.0.0',
            'endpoints': {
                'read': '/{url}',
                'health': '/health'
            }
        })

    # Construct URL
    url = path if path.startswith('http') else f'https://{path}'

    try:
        # Validate URL
        parsed = urlparse(url)
        if not parsed.netloc:
            return jsonify({'error': 'Invalid URL', 'message': f'Cannot parse URL: {url}'}), 400

        # Fetch webpage
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract content
        def get_title():
            title = soup.find('title')
            if title:
                return title.get_text().strip()
            og_title = soup.find('meta', property='og:title')
            if og_title:
                return og_title.get('content', '').strip()
            h1 = soup.find('h1')
            if h1:
                return h1.get_text().strip()
            return 'Untitled'

        def get_description():
            desc = soup.find('meta', attrs={'name': 'description'})
            if desc:
                return desc.get('content', '')
            og_desc = soup.find('meta', property='og:description')
            if og_desc:
                return og_desc.get('content', '')
            return ''

        def get_favicon():
            icon = soup.find('link', rel='icon')
            if icon:
                href = icon.get('href', '')
                if not href.startswith('http'):
                    base = f"{parsed.scheme}://{parsed.netloc}"
                    return urljoin(base, href)
                return href
            return f"{parsed.scheme}://{parsed.netloc}/favicon.ico"

        def extract_content():
            # Try different content selectors
            content_selectors = [
                ('article', {}),
                ('[role="main"]', {}),
                ('main', {}),
                ('#content', {}),
                ('.content', {}),
                ('.post-content', {}),
                ('.article-content', {}),
            ]

            for selector, attrs in content_selectors:
                element = soup.find(selector, attrs)
                if element:
                    # Remove unwanted elements
                    for unwanted in element.find_all(['script', 'style', 'nav', 'header', 'footer', 'aside']):
                        unwanted.decompose()

                    text = element.get_text(separator='\n', strip=True)
                    if len(text) > 100:
                        return text[:10000]  # Limit to 10000 chars

            # Fallback to body
            body = soup.find('body')
            if body:
                for unwanted in body.find_all(['script', 'style', 'nav', 'header', 'footer']):
                    unwanted.decompose()
                return body.get_text(separator='\n', strip=True)[:5000]

            return ''

        result = {
            'title': get_title(),
            'url': url,
            'description': get_description(),
            'favicon': get_favicon(),
            'content': extract_content(),
            'wordCount': len(extract_content().split())
        }

        return jsonify(result)

    except requests.exceptions.RequestException as e:
        return jsonify({
            'error': 'Fetch Error',
            'message': str(e),
            'url': url
        }), 500
    except Exception as e:
        return jsonify({
            'error': 'Server Error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    print(f'MCP Reader Service running on port {PORT}')
    app.run(host='0.0.0.0', port=PORT)
