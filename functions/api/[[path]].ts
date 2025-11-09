/**
 * @file This file implements a Cloudflare Pages function that acts as a secure
 * proxy to iFlytek (Xunfei) services. It routes requests to either:
 * 1. Speech Evaluation (suntone) via WebSocket for pronunciation scoring.
 * 2. Text-to-Speech (TTS) via HTTP POST for generating demonstration audio.
 *
 * NOTE: The primary cause of 'Timeout' errors is often a misconfigured IP whitelist
 * in the Xunfei developer console. This function's code is correct, but Xunfei's
 * firewall may silently drop requests from unknown IPs, leading to a timeout here.
 */

import { EvaluationRequestBody, TtsRequestBody } from '../../types';

// Minimal type definition for a Cloudflare Pages function handler.
type PagesFunction = (context: {
  request: Request;
  env: Record<string, any>;
}) => Promise<Response>;

// --- Hashing and Encoding Utilities ---
const toBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

const utf8StringToBuf = (str: string): ArrayBuffer => {
    return new TextEncoder().encode(str).buffer;
};

async function sha256_base64(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return toBase64(hashBuffer);
}

// --- Xunfei Authentication Logic ---

/**
 * Generates the required authentication headers for Xunfei HTTP/WebSocket APIs.
 */
async function getXunfeiAuthParams(
  env: Record<string, any>, 
  host: string, 
  path: string, 
  method: 'GET' | 'POST' = 'GET',
  body?: string
): Promise<{ date: string; authorization: string; digestHeader?: string }> {
    const date = new Date().toUTCString();
    let signatureOrigin = `host: ${host}\ndate: ${date}\n${method} ${path} HTTP/1.1`;
    let headers = 'host date request-line';
    let digestHeader: string | undefined = undefined;

    // For POST requests with a body, a digest must be included in the signature.
    if (method === 'POST' && body) {
        const bodyDigest = await sha256_base64(utf8StringToBuf(body));
        digestHeader = `SHA-256=${bodyDigest}`;
        signatureOrigin += `\ndigest: ${digestHeader}`;
        headers += ' digest';
    }

    const secretKey = env.XUNFEI_API_SECRET;
    const cryptoKey = await crypto.subtle.importKey(
        'raw', utf8StringToBuf(secretKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, utf8StringToBuf(signatureOrigin));
    const signature = toBase64(signatureBuffer);

    const authorizationOrigin = `api_key="${env.XUNFEI_API_KEY}", algorithm="hmac-sha256", headers="${headers}", signature="${signature}"`;
    const authorization = btoa(authorizationOrigin);
    
    return { date, authorization, digestHeader };
}

// --- WebSocket Handler for Speech Evaluation ---
async function handleEvaluation(request: Request, env: Record<string, any>): Promise<Response> {
  const { audioBase64, referenceText, audioMimeType } = await request.json() as EvaluationRequestBody;
  
  // Determine the audio encoding format for the API request.
  const encoding = audioMimeType === 'audio/pcm' ? 'raw' : 'lame';
  
  // Dynamically construct the authenticated WebSocket URL.
  const host = 'cn-east-1.ws-api.xf-yun.com';
  const path = '/v1/private/s8e098720';
  const { date, authorization } = await getXunfeiAuthParams(env, host, path, 'GET');
  const params = new URLSearchParams({ host, date, authorization });
  const authUrl = `wss://${host}${path}?${params.toString()}`;

  // This Promise wraps the entire WebSocket lifecycle.
  const result = await new Promise((resolve, reject) => {
      const ws = new WebSocket(authUrl);
      const timeoutId = setTimeout(() => {
          if (ws.readyState < WebSocket.CLOSING) {
              ws.close(1001, 'Timeout');
          }
          // The 'close' event handler will then reject the promise.
      }, 15000); // 15-second timeout

      const cleanup = () => clearTimeout(timeoutId);

      ws.onopen = () => {
          const requestFrame = {
              header: { app_id: env.XUNFEI_APP_ID, status: 0 },
              parameter: {
                  st: {
                      lang: 'en', core: 'word', refText: referenceText, phoneme_output: 1,
                      result: { encoding: 'utf8', compress: 'raw', format: 'json' }
                  }
              },
              payload: {
                  data: {
                      encoding, sample_rate: 16000, channels: 1, bit_depth: 16, status: 0, audio: audioBase64,
                  }
              }
          };
          ws.send(JSON.stringify(requestFrame));
          // Send the final frame immediately after the first one.
          ws.send(JSON.stringify({ header: { app_id: env.XUNFEI_APP_ID, status: 2 } }));
      };

      ws.onmessage = (event) => {
          const response = JSON.parse(event.data as string);
          if (response.header.code === 0 && response.payload?.result?.text) {
              cleanup();
              const decodedResult = JSON.parse(atob(response.payload.result.text));
              resolve(decodedResult.result);
              ws.close(1000, "Task completed");
          } else if (response.header.code !== 0) {
              cleanup();
              reject({ message: `AI 引擎错误: ${response.header.message || '未知错误'}`, code: 'XF_API_ERROR' });
              ws.close(4000, "Error received");
          }
      };

      ws.onerror = () => {
          cleanup();
          reject({ message: '与 AI 评分服务连接失败。', code: 'XF_CONNECTION_FAILED' });
      };
      
      ws.onclose = (event) => {
          cleanup();
          if (event.code === 1001 && event.reason === 'Timeout') {
              reject({ message: 'AI 引擎响应超时。', code: 'XF_TIMEOUT' });
          } else if (!event.wasClean) {
              reject({ message: `与 AI 评分服务的连接意外断开 (Code: ${event.code})。`, code: 'XF_CONNECTION_CLOSED' });
          }
      };
  });

  return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
  });
}

// --- HTTP Handler for Text-to-Speech ---
async function handleTts(request: Request, env: Record<string, any>): Promise<Response> {
    const { text } = await request.json() as TtsRequestBody;

    const host = 'tts-api.xfyun.cn';
    const path = '/v2/tts';
    
    const ttsRequestBody = JSON.stringify({
        header: { app_id: env.XUNFEI_APP_ID },
        parameter: {
            tts: { ent: 'en_vip', vcn: 'abby', aue: 'lame', tte: 'UTF8' }
        },
        payload: {
            text: {
                encoding: 'UTF8', status: 2, text: toBase64(utf8StringToBuf(text))
            }
        }
    });

    const { date, authorization, digestHeader } = await getXunfeiAuthParams(env, host, path, 'POST', ttsRequestBody);
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json', 'Host': host, 'Date': date, 'Authorization': authorization
    };
    if (digestHeader) headers['Digest'] = digestHeader;

    const response = await fetch(`https://${host}${path}`, {
        method: 'POST',
        headers,
        body: ttsRequestBody
    });

    const responseData = await response.json() as any;
    
    if (responseData.header?.code !== 0) {
        throw new Error(`音频合成失败 (${responseData.header?.code || 'N/A'}): ${responseData.header?.message || '未知错误'}`);
    }

    return new Response(JSON.stringify({ audioBase64: responseData.payload.audio.audio }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}


/**
 * Main Cloudflare Pages function that routes requests to the appropriate handler.
 * It now uses the universal `onRequest` handler for better compatibility.
 */
export const onRequest: PagesFunction = async ({ request, env }) => {
  // This function now explicitly handles POST requests only.
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const url = new URL(request.url);
  try {
    const { XUNFEI_APP_ID, XUNFEI_API_KEY, XUNFEI_API_SECRET } = env;
    if (!XUNFEI_APP_ID || !XUNFEI_API_KEY || !XUNFEI_API_SECRET) {
      console.error('Xunfei environment variables are not set.');
      throw new Error('Server configuration error.');
    }

    if (url.pathname === '/api/evaluation') {
      return await handleEvaluation(request, env);
    }

    if (url.pathname === '/api/tts') {
      return await handleTts(request, env);
    }
    
    return new Response('Not Found', { status: 404 });

  } catch (error: any) {
    console.error(`Error in proxy for ${url.pathname}:`, error);
    const errorMessage = error.message || 'An unknown error occurred.';
    const errorCode = error.code || 'UNKNOWN';
    return new Response(JSON.stringify({ error: `服务错误: ${errorMessage}`, code: errorCode }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
