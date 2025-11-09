/**
 * @file This file implements a Cloudflare Pages function that acts as a secure
 * proxy to iFlytek (Xunfei) services. It routes requests to either:
 * 1. Speech Evaluation (suntone) via WebSocket for pronunciation scoring.
 * 2. Text-to-Speech (TTS) via HTTP POST for generating demonstration audio.
 */

import { EvaluationRequestBody, TtsRequestBody } from '../../types';

// Minimal type definition for a Cloudflare Pages function handler.
type PagesFunction = (context: {
  request: Request;
  env: Record<string, any>;
}) => Promise<Response>;

// --- Hashing and Encoding Helpers ---
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
  const { audioBase64, referenceText } = await request.json() as EvaluationRequestBody;
  
  const host = 'cn-east-1.ws-api.xf-yun.com';
  const path = '/v1/private/s8e098720';
  const { date, authorization } = await getXunfeiAuthParams(env, host, path, 'GET');

  const params = new URLSearchParams({ host, date, authorization });
  const authUrl = `wss://${host}${path}?${params.toString()}`;

  const result = await new Promise((resolve, reject) => {
      const ws = new WebSocket(authUrl);

      ws.addEventListener('open', () => {
          const requestFrame = {
              header: { app_id: env.XUNFEI_APP_ID, status: 0 }, // status 0 for start frame
              parameter: {
                  st: {
                      lang: 'en', core: 'word', refText: referenceText, phoneme_output: 1,
                      result: { encoding: 'utf8', compress: 'raw', format: 'json' }
                  }
              },
              payload: {
                  data: {
                      encoding: 'lame', sample_rate: 16000, channels: 1, bit_depth: 16,
                      status: 0, // status 0 for start frame
                      audio: audioBase64,
                  }
              }
          };
          // The API expects data in chunks, but for short audio, we can send start and end frames back-to-back.
          ws.send(JSON.stringify(requestFrame));
          // Send end frame
          ws.send(JSON.stringify({ header: { app_id: env.XUNFEI_APP_ID, status: 2 } }));
      });

      ws.addEventListener('message', (event) => {
          const response = JSON.parse(event.data as string);
          if (response.header.code === 0 && response.payload?.result?.text) {
              const decodedResult = JSON.parse(atob(response.payload.result.text));
              resolve(decodedResult.result);
              ws.close(1000, "Task completed");
          } else if (response.header.code !== 0) {
              reject(new Error(`AI 引擎错误: ${response.header.message || '未知错误'}`));
              ws.close(4000, "Error received");
          }
      });

      ws.addEventListener('error', () => reject(new Error('与 AI 评分服务连接失败。')));
      ws.addEventListener('close', (event) => {
          if (!event.wasClean) reject(new Error('与 AI 评分服务的连接意外断开。'));
      });
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
    
    const ttsRequestBody = {
        header: { app_id: env.XUNFEI_APP_ID },
        parameter: {
            synthesis: { ent: 'en_vip', vcn: 'abby', aue: 'lame', tte: 'UTF8' }
        },
        payload: {
            text: {
                encoding: 'UTF8',
                status: 2,
                text: toBase64(utf8StringToBuf(text))
            }
        }
    };
    const bodyString = JSON.stringify(ttsRequestBody);

    const { date, authorization, digestHeader } = await getXunfeiAuthParams(env, host, path, 'POST', bodyString);

    const ttsUrl = `https://${host}${path}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Host': host,
        'Date': date,
        'Authorization': authorization
    };
    if (digestHeader) {
        headers['Digest'] = digestHeader;
    }

    const response = await fetch(ttsUrl, {
        method: 'POST',
        headers: headers,
        body: bodyString
    });

    const responseData = await response.json();
    
    if (responseData.header?.code !== 0) {
        throw new Error(`音频合成失败 (${responseData.header?.code || 'N/A'}): ${responseData.header?.message || '未知错误'}`);
    }

    return new Response(JSON.stringify({ audioBase64: responseData.payload.audio.audio }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}


/**
 * Main request handler that routes to the appropriate function.
 */
export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);

  try {
    const { XUNFEI_APP_ID, XUNFEI_API_KEY, XUNFEI_API_SECRET } = env;
    if (!XUNFEI_APP_ID || !XUNFEI_API_KEY || !XUNFEI_API_SECRET) {
      console.error('Xunfei environment variables not set.');
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
    return new Response(JSON.stringify({ error: `服务错误: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};