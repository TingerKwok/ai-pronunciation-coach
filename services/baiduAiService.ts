import { PracticeItem, PracticeLevel, ScoreResult } from '../types';

// --- Access Token Caching ---
interface BaiduToken {
  access_token: string;
  expires_at: number;
}
let cachedToken: BaiduToken | null = null;

/**
 * Fetches and caches the access token from our secure Cloudflare proxy.
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expires_at > now) {
    return cachedToken.access_token;
  }

  // The request is now sent to our own secure serverless function.
  const url = `/api/token`;
  
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }});
  
  if (!response.ok) {
    throw new Error('获取 Access Token 失败 (代理服务出错)。');
  }

  const data = await response.json();
  const expiresIn = data.expires_in; // in seconds
  
  cachedToken = {
    access_token: data.access_token,
    expires_at: now + (expiresIn - 60) * 1000, // Refresh 1 minute before expiry
  };

  return cachedToken.access_token;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // result is a data URL: "data:audio/mp3;base64,..."
        // We only need the base64 part
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject('Failed to read blob as base64');
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
};

/**
 * Generates audio from text using Baidu's TTS model via our secure proxy.
 * Returns the Base64 encoded MP3 audio string.
 */
export const getTextToSpeechAudio = async (textToSpeak: string): Promise<string> => {
  const accessToken = await getAccessToken();
  
  // The URL now points to our secure serverless proxy.
  const params = new URLSearchParams({
    tex: textToSpeak,
    lan: 'en',
    ctp: '1',
    cuid: 'baidufree',
    tok: accessToken,
    per: '5117', // Standard British male
    spd: '5',
    pit: '5',
    vol: '5',
    aue: '3', // mp3
  });
  const url = `/api/text2audio?${params.toString()}`;

  try {
    const response = await fetch(url, { method: 'POST' });

    if (response.headers.get('Content-Type')?.includes('application/json')) {
        const errorData = await response.json();
        console.error('Baidu TTS Error (via proxy):', errorData);
        throw new Error(`语音合成失败: ${errorData.err_msg}`);
    }

    if (!response.ok) {
        throw new Error(`语音合成服务网络错误: ${response.statusText}`);
    }
    
    const audioBlob = await response.blob();
    const base64Audio = await blobToBase64(audioBlob);
    return base64Audio;
  } catch(error) {
    console.error("Error generating Baidu TTS audio (via proxy):", error);
    throw new Error('语音合成服务暂时不可用，请稍后再试。');
  }
};

const getMimeTypeForBaidu = (mimeType: string): string => {
    if (mimeType.includes('wav')) return 'wav';
    if (mimeType.includes('pcm')) return 'pcm';
    if (mimeType.includes('webm') || mimeType.includes('opus')) return 'opus';
    if (mimeType.includes('mp3')) return 'mp3';
    return 'wav';
}

/**
 * Gets a pronunciation score from Baidu's Speech Assessment API via our secure proxy.
 */
export const getPronunciationScore = async (
  audioBase64: string,
  audioMimeType: string,
  item: PracticeItem,
  level: PracticeLevel
): Promise<ScoreResult> => {
    const accessToken = await getAccessToken();
    
    // The URL now points to our secure serverless proxy.
    const url = `/api/evaluation?access_token=${accessToken}`;

    const referenceText = level === PracticeLevel.Phonemes ? item.exampleWord || item.text : item.text;

    const requestBody = {
        lang: 'en',
        format: getMimeTypeForBaidu(audioMimeType),
        rate: 16000,
        channel: 1,
        speech: audioBase64,
        text: referenceText,
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`AI评分服务网络错误: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.error_code) {
             console.error('Baidu Score Error (via proxy):', result);
             throw new Error(`AI评分失败: ${result.error_msg}`);
        }

        const score = Math.round(result.result.total_score);
        let feedback = "表现不错，继续加油！";

        if (score < 85) {
            const lowScoreWords = result.result.words.filter((w: any) => w.word_score < 4.0); // Baidu score is 1-5
            if (lowScoreWords.length > 0) {
                feedback = `很棒的尝试！可以多注意一下这些单词的发音：${lowScoreWords.map((w: any) => w.word).join(', ')}。`;
            } else {
                feedback = "整体不错，注意一下发音的准确度和流畅性，可以更好！";
            }
        }
        
        return {
            score,
            feedback,
        };

    } catch (error) {
        console.error("Error getting Baidu pronunciation score (via proxy):", error);
        throw new Error('AI评分服务暂时不可用，请稍后再试。');
    }
};