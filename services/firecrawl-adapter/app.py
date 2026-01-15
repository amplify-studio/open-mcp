#!/usr/bin/env python3
"""
Firecrawl Reader Adapter
将 Jina Reader 兼容的 GET 请求转换为 Firecrawl API 的 POST 请求

支持的格式：
1. Jina Reader: GET /api/read/http://example.com
2. Nginx 兼容: GET /http://example.com (nginx rewrite 后)
3. 带参数: GET /http://example.com?mobile=true&screenshot=true
"""

from flask import Flask, request, Response, jsonify
import requests
import os
from urllib.parse import unquote, urlparse, parse_qs

app = Flask(__name__)

# 配置
FIRECRAWL_API_URL = os.getenv(
    'FIRECRAWL_API_URL',
    'http://firecrawl-api-test:3002'
)
FIRECRAWL_API_KEY = os.getenv('FIRECRAWL_API_KEY', '')

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return 'OK', 200

@app.route('/api/read', methods=['POST'])
def read_post():
    """
    POST /api/read
    Body: {"url": "http://example.com", "mobile": true, "screenshot": true}
    """
    try:
        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({'error': 'Missing url parameter'}), 400

        url = data['url']
        options = {
            'mobile': data.get('mobile', False),
            'screenshot': data.get('screenshot', False),
            'onlyMainContent': data.get('onlyMainContent', True),
            'includeHtml': data.get('includeHtml', False),
            'formats': data.get('formats', ['markdown']),
        }
        return scrape_with_firecrawl(url, options)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/read/<path:url>', methods=['GET'])
def read_get_with_prefix(url):
    """
    GET /api/read/http://example.com?mobile=true
    兼容 Jina Reader API 格式
    """
    try:
        decoded_url = unquote(url)
        decoded_url = fix_url(decoded_url)

        options = parse_options_from_query()
        return scrape_with_firecrawl(decoded_url, options)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/', methods=['GET'])
def index():
    """根路径"""
    return jsonify({
        'service': 'Firecrawl Reader Adapter',
        'version': '1.0.0',
        'endpoints': {
            'GET /<url>': 'Nginx compatible (e.g., /http://example.com)',
            'GET /api/read/<url>': 'Jina Reader compatible',
            'POST /api/read': 'JSON body with parameters',
        },
        'supported_params': {
            'mobile': 'Mobile user agent',
            'screenshot': 'Include screenshot',
            'onlyMainContent': 'Extract only main content (default: true)',
            'includeHtml': 'Include HTML (default: false)',
            'formats': 'Response formats (default: markdown)',
        },
        'examples': {
            'mobile': '/http://example.com?mobile=true',
            'screenshot': '/http://example.com?screenshot=true',
            'combined': '/http://example.com?mobile=true&screenshot=true',
        }
    })

# 新增：支持根路径后的 URL (nginx rewrite 后的格式)
@app.route('/<path:url>', methods=['GET'])
def read_get_root(url):
    """
    GET /http://example.com?mobile=true
    Nginx rewrite 后的格式：
    rewrite ^/api/read/(.*)$ /$1 break;
    """
    # 忽略非 URL 路径
    if '.' not in url and '/' not in url[:10]:
        return index()

    try:
        decoded_url = unquote(url)
        decoded_url = fix_url(decoded_url)

        options = parse_options_from_query()
        return scrape_with_firecrawl(decoded_url, options)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def fix_url(url):
    """修复 URL 编码问题"""
    # 如果 URL 以 http: 或 https: 开头但没有双斜杠，修复它
    if url.startswith('http:') and not url.startswith('http://'):
        url = url.replace('http:', 'http://', 1)
    elif url.startswith('https:') and not url.startswith('https://'):
        url = url.replace('https:', 'https://', 1)
    return url

def parse_options_from_query():
    """从 URL query 参数解析选项"""
    options = {
        'mobile': False,  # mobile 功能在当前 Firecrawl 版本中不可用
        'screenshot': request.args.get('screenshot', 'false').lower() == 'true',
        'onlyMainContent': request.args.get('onlyMainContent', 'true').lower() == 'true',
        'includeHtml': request.args.get('includeHtml', 'false').lower() == 'true',
        'formats': ['markdown', 'html'] if request.args.get('includeHtml', 'false').lower() == 'true' else ['markdown'],
    }

    # 支持 waitFor 参数
    if 'waitFor' in request.args:
        try:
            options['waitFor'] = int(request.args.get('waitFor'))
        except ValueError:
            pass

    return options

def scrape_with_firecrawl(url, options=None):
    """调用 Firecrawl API 抓取网页"""
    if options is None:
        options = {
            'mobile': False,
            'screenshot': False,
            'onlyMainContent': True,
            'includeHtml': False,
            'formats': ['markdown'],
        }

    try:
        # 构建请求
        headers = {
            'Content-Type': 'application/json'
        }

        if FIRECRAWL_API_KEY:
            headers['Authorization'] = f'Bearer {FIRECRAWL_API_KEY}'

        # v1 API: 参数直接放在 payload 中，不是 pageOptions
        payload = {
            'url': url,
            'formats': ['markdown'],
            'timeout': 180000,  # 180 秒超时 (v1 API 默认 30 秒太短)
        }

        # 添加可选参数
        if options.get('includeHtml'):
            payload['formats'] = ['markdown', 'html']

        if not options.get('onlyMainContent', True):
            payload['onlyMainContent'] = False

        if options.get('waitFor'):
            payload['waitFor'] = options['waitFor']

        if options.get('mobile'):
            # mobile 不支持，添加到 formats 会报错，忽略
            print(f"[DEBUG] Mobile enabled (may not be supported): {url}")

        if options.get('screenshot'):
            payload['formats'] = payload.get('formats', ['markdown']) + ['screenshot']

        print(f"[DEBUG] Payload: {payload}")

        # 调用 Firecrawl API
        response = requests.post(
            f'{FIRECRAWL_API_URL}/v1/scrape',
            json=payload,
            headers=headers,
            timeout=180  # 增加到 3 分钟，支持慢速网站
        )

        print(f"[DEBUG] Response status: {response.status_code}")
        if response.status_code != 200:
            print(f"[DEBUG] Response body: {response.text[:500]}")

        # 检查响应
        if response.status_code == 200:
            data = response.json()

            if data.get('success'):
                nested_data = data.get('data', {})
                markdown_content = nested_data.get('markdown', '')

                # 始终返回 JSON 格式（符合 Jina Reader API 标准）
                result = {
                    'success': True,
                    'content': markdown_content,
                    'url': url,
                    'metadata': nested_data.get('metadata', {})
                }

                # 如果请求了 screenshot，添加到响应中
                if options.get('screenshot') and 'screenshot' in nested_data:
                    result['screenshot'] = nested_data.get('screenshot')

                return jsonify(result)
            else:
                error = data.get('error', 'Unknown error')
                return jsonify({'error': error}), 500
        else:
            return jsonify({
                'error': f'Firecrawl API error: {response.status_code}',
                'details': response.text
            }), 500

    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timeout'}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Request failed: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8082))
    app.run(host='0.0.0.0', port=port, debug=False)
