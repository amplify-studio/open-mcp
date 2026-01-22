/**
 * Zhipu AI API Client
 * Handles HTTP requests to Zhipu AI vision and image generation APIs
 */

const ZHIPU_API_BASE = 'https://open.bigmodel.cn/api/paas/v4';

function getZhipuApiKey(): string {
  const apiKey = process.env.ZHIPUAI_API_KEY;
  if (!apiKey) {
    throw new Error('ZHIPUAI_API_KEY environment variable is required');
  }
  return apiKey;
}

interface VisionMessage {
  role: 'user' | 'assistant' | 'system';
  content: Array<{
    type: 'text' | 'image_url' | 'video_url' | 'file_url';
    text?: string;
    image_url?: { url: string };
    video_url?: { url: string };
    file_url?: { url: string };
  }>;
}

interface VisionAPIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ImageGenAPIResponse {
  data: Array<{
    url: string;
  }>;
}

interface ZhipuError {
  error?: {
    code?: string;
    message: string;
  };
}

async function handleAPIError(response: Response, context: string): Promise<never> {
  const errorData: ZhipuError = await response.json().catch(() => ({}));
  const errorMessage = errorData.error?.message || `HTTP ${response.status}`;

  let errorPrefix = 'API error';
  if (response.status === 401) {
    errorPrefix = 'Authentication failed';
  } else if (response.status >= 500) {
    errorPrefix = 'Server error';
  }

  throw new Error(`${errorPrefix}: ${errorMessage}`);
}

async function fetchZhipuAPI(
  endpoint: string,
  body: Record<string, unknown>
): Promise<Response> {
  const ZHIPU_API_KEY = getZhipuApiKey();

  return fetch(`${ZHIPU_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ZHIPU_API_KEY}`
    },
    body: JSON.stringify(body)
  });
}

/**
 * Call GLM-4.6V-Flash for image/video/document understanding
 */
export async function callVisionAPI(
  messages: VisionMessage[],
  thinking: boolean = false
): Promise<string> {
  const response = await fetchZhipuAPI('/chat/completions', {
    model: 'glm-4.6v-flash',
    messages,
    thinking: {
      type: thinking ? 'enabled' : 'disabled'
    }
  });

  if (!response.ok) {
    await handleAPIError(response, 'Vision API');
  }

  const data: VisionAPIResponse = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('No response from vision API');
  }

  return data.choices[0].message.content;
}

/**
 * Call Cogview-3-Flash for image generation
 */
export async function callImageGenAPI(
  prompt: string,
  size: string = '1024x1024'
): Promise<string> {
  const response = await fetchZhipuAPI('/images/generations', {
    model: 'cogview-3-flash',
    prompt,
    size
  });

  if (!response.ok) {
    const errorData: ZhipuError = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
    throw new Error(`Image generation API error (${response.status}): ${errorMessage}`);
  }

  const data: ImageGenAPIResponse = await response.json();

  if (!data.data?.[0]?.url) {
    throw new Error('No images generated');
  }

  return data.data[0].url;
}
