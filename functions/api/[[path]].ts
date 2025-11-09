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
    // FIX: Corrected typo in algorithm name from 'SHA-266' to 'SHA-256'.
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

    const authorizationOrigin = `api_key="${env.XUNFEI_API_KEY}", algorithm="hmac-sha-256", headers="${headers}", signature="${signature}"`;
    const authorization = btoa(authorizationOrigin);
    
    return { date, authorization, digestHeader };
}

// --- WebSocket Handler for Speech Evaluation ---
async function handleEvaluation(request: Request, env: Record<string, any>): Promise<Response> {
    const { audioBase64, referenceText, audioMimeType } = await request.json() as EvaluationRequestBody;
    const encoding = audioMimeType === 'audio/pcm' ? 'raw' : 'lame';
  
    const host = 'cn-east-1.ws-api.xf-yun.com';
    const path = '/v1/private/s8e098720';
    const { date, authorization } = await getXunfeiAuthParams(env, host, path, 'GET');
    const params = new URLSearchParams({ host, date, authorization });
    
    // For Cloudflare Workers, initiate WebSocket with an HTTPS fetch and an 'Upgrade' header.
    const fetchUrl = `https://${host}${path}?${params.toString()}`;
    const upgradeResponse = await fetch(fetchUrl, {
      headers: { 'Upgrade': 'websocket' }
    });
  
    // FIX: The standard `Response` type does not include the `webSocket` property, which is a Cloudflare-specific extension for handling WebSocket upgrades. Cast to `any` to bypass the type check.
    const ws = (upgradeResponse as any).webSocket;
    if (!ws) {
      const errorBody = await upgradeResponse.text();
      console.error("WebSocket upgrade failed:", upgradeResponse.status, errorBody);
      throw new Error(`AI 引擎连接握手失败 (status: ${upgradeResponse.status}).`);
    }

    // This Promise wraps the WebSocket lifecycle.
    const result = await new Promise((resolve, reject) => {
        let settled = false;
        const settle = (func: Function, value: any) => {
            if (!settled) {
                settled = true;
                cleanup();
                func(value);
            }
        };

        const timeoutId = setTimeout(() => {
            ws.close(1001, 'Timeout');
        }, 15000); // 15-second timeout

        const cleanup = () => clearTimeout(timeoutId);

        ws.accept();

        ws.addEventListener('message', (event) => {
            try {
                const response = JSON.parse(event.data as string);
                if (response.header.code === 0 && response.payload?.result?.text) {
                    const decodedResult = JSON.parse(atob(response.payload.result.text));
                    settle(resolve, decodedResult.result);
                    ws.close(1000, "Task completed");
                } else if (response.header.code !== 0) {
                    settle(reject, { message: `AI 引擎错误: ${response.header.message || '未知错误'}`, code: 'XF_API_ERROR' });
                    ws.close(4000, "Error received");
                }
            } catch (e) {
                settle(reject, { message: '解析 AI 引擎响应失败。', code: 'XF_PARSE_ERROR' });
                ws.close(4001, "Parse error");
            }
        });

        ws.addEventListener('error', () => {
            settle(reject, { message: '与 AI 评分服务连接失败。', code: 'XF_CONNECTION_FAILED' });
        });

        ws.addEventListener('close', (event) => {
            if (event.code === 1001 && event.reason === 'Timeout') {
                settle(reject, { message: 'AI 引擎响应超时。', code: 'XF_TIMEOUT' });
            } else if (!event.wasClean && event.code !== 1000) {
                settle(reject, { message: `与 AI 评分服务的连接意外断开 (Code: ${event.code})。`, code: 'XF_CONNECTION_CLOSED' });
            }
        });
        
        // Send data after accepting and setting up listeners.
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
        ws.send(JSON.stringify({ header: { app_id: env.XUNFEI_APP_ID, status: 2 } }));
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
 * It explicitly checks for the POST method to ensure stability.
 */
export const onRequest: PagesFunction = async ({ request, env }) => {
  // Browsers send an OPTIONS request (preflight) for complex requests,
  // such as one with a 'Content-Type: application/json' header.
  // We need to handle this to allow the actual POST request to proceed.
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204, // No Content
      headers: {
        'Access-Control-Allow-Origin': '*', // In production, you might want to restrict this to your domain
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400', // Cache preflight response for 1 day
      },
    });
  }
  
  // Explicitly handle only POST requests for our API endpoints.
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { 'Allow': 'POST' } });
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