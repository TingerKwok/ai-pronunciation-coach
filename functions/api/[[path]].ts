/**
 * Define types for Cloudflare Pages Functions to ensure type safety.
 * In a real Cloudflare Pages environment, these types are globally available.
 */
interface EventContext<Env, P extends string, Data> {
  request: Request;
  env: Env;
  params: Record<P, string | string[]>;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  data: Data;
}
type PagesFunction<
  Env = unknown,
  P extends string = any,
  Data extends Record<string, unknown> = Record<string, unknown>
> = (context: EventContext<Env, P, Data>) => Response | Promise<Response>;

/**
 * Define the environment variables that this function expects.
 * These must be configured in the Cloudflare dashboard.
 */
interface Env {
  BAIDU_API_KEY: string;
  BAIDU_SECRET_KEY: string;
}

/**
 * This Cloudflare Pages function acts as a secure backend proxy for the Baidu AI APIs.
 * It intercepts requests from the frontend, injects the necessary API secrets,
 * and forwards them to Baidu. This prevents exposing sensitive credentials
 * on the client-side.
 *
 * It handles three routes:
 * 1. `/api/token`: Fetches a new access token from Baidu.
 * 2. `/api/text2audio`: Proxies requests to the Text-to-Speech API.
 * 3. `/api/evaluation`: Proxies requests to the Speech Evaluation API, adapting the request format.
 */
export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const url = new URL(request.url);
  // `params.path` is a catch-all for the path segments, e.g., ['token'] or ['text2audio']
  const path = Array.isArray(params.path) ? params.path.join('/') : params.path;

  // --- Route: /api/token ---
  if (path === 'token') {
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${env.BAIDU_API_KEY}&client_secret=${env.BAIDU_SECRET_KEY}`;
    
    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      // Pass the response from Baidu directly back to the client
      return new Response(response.body, {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error proxying /api/token to Baidu:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // --- Route: /api/text2audio ---
  if (path === 'text2audio') {
    // Forward all query parameters from the client request
    const ttsUrl = `https://tsn.baidu.com/text2audio?${url.searchParams.toString()}`;

    try {
      const response = await fetch(ttsUrl, { method: 'POST' });

      // Baidu TTS API returns audio/* on success and application/json on error.
      // We stream the response directly back to the client.
      const headers = new Headers(response.headers);
      
      // Ensure CORS headers are set if needed for local development or different domains.
      headers.set('Access-Control-Allow-Origin', '*'); 

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
      });

    } catch (error) {
      console.error('Error proxying /api/text2audio to Baidu:', error);
       return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  // --- Route: /api/evaluation ---
  if (path === 'evaluation') {
    const accessToken = url.searchParams.get('access_token');
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Missing access_token parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // The client sends the token in the URL, but the Baidu API expects it in the body.
    // This proxy corrects the request format.
    const evalUrl = `https://vop.baidu.com/server_api`;

    try {
      const clientRequestBody = await request.json();
      
      const baiduRequestBody = {
        ...clientRequestBody,
        token: accessToken,
        cuid: 'pronunciation-coach-app', // A static CUID is required by the Baidu API.
      };

      const baiduResponse = await fetch(evalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(baiduRequestBody),
      });

      // Pass the JSON response from Baidu directly back to the client.
      return new Response(baiduResponse.body, {
        status: baiduResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Error proxying /api/evaluation to Baidu:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // --- Fallback for any other routes ---
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
};
