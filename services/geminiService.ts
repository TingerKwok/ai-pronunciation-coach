import { GoogleGenAI, Type, Modality } from '@google/genai';
import { PracticeItem, PracticeLevel, ScoreResult } from '../types';

// This file uses the VITE_API_KEY environment variable.
// It is configured in the vite.config.ts to be exposed as process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


const getPromptForLevel = (level: PracticeLevel, item: PracticeItem): string => {
  const levelText = {
    [PracticeLevel.Phonemes]: 'phoneme',
    [PracticeLevel.Words]: 'word',
    [PracticeLevel.Phrases]: 'phrase',
    [PracticeLevel.Sentences]: 'sentence',
  }[level];

  // For phonemes, we provide the example word as context for a more accurate evaluation.
  const context = level === PracticeLevel.Phonemes && item.exampleWord 
    ? `(The user is practicing the phoneme "${item.ipa}" as in the word "${item.exampleWord}")` 
    : '';

  return `You are an expert English pronunciation coach specializing in a British accent. Your task is to evaluate a user's pronunciation of a given English ${levelText}.
The user has provided an audio recording. You must compare their pronunciation in the audio to the provided text and its International Phonetic Alphabet (IPA) transcription.

Based on your analysis, provide a score from 0 to 100, where 100 is a perfect native-like British pronunciation.
Also, provide constructive, concise feedback in Chinese, highlighting any specific phonemes, words, or intonation patterns that could be improved. The feedback should be encouraging and easy for a learner to understand.

Reference Text: "${item.text}"
Reference IPA: "${item.ipa}"
${context}

Provide your response ONLY in the specified JSON format, with no additional text, comments, or markdown formatting.`;
};


export const getPronunciationScore = async (
  audioBase64: string,
  audioMimeType: string,
  item: PracticeItem,
  level: PracticeLevel
): Promise<ScoreResult> => {
  if (!process.env.API_KEY) {
    throw new Error('AI评分服务未配置，请联系管理员。');
  }
  try {
    const prompt = getPromptForLevel(level, item);

    const audioPart = {
      inlineData: {
        data: audioBase64,
        mimeType: audioMimeType,
      },
    };

    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Use a faster model for scoring to reduce latency.
      contents: [{ parts: [textPart, audioPart] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.NUMBER,
              description: 'A pronunciation score from 0 to 100.',
            },
            feedback: {
              type: Type.STRING,
              description: 'Constructive feedback in Chinese on how to improve.',
            },
          },
          required: ['score', 'feedback'],
        },
      },
    });
    
    const resultJson = response.text;
    const result = JSON.parse(resultJson);

    if (typeof result.score === 'number' && typeof result.feedback === 'string') {
      return result;
    } else {
      throw new Error('Invalid response format from AI.');
    }
  } catch (error) {
    console.error("Error getting pronunciation score:", error);
    throw new Error('AI评分服务暂时不可用，请稍后再试。');
  }
};

/**
 * Generates high-quality audio from text using the Gemini TTS model.
 * It now expects a simple, speakable text for all inputs.
 * Returns the Base64 encoded audio string for playback via Web Audio API.
 */
export const getTextToSpeechAudio = async (textToSpeak: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error('音频服务未配置，请联系管理员。');
  }
  
  try {
     const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ 
          parts: [{ text: `Speak in a standard, clear British accent: ${textToSpeak}` }] 
        }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            // Using a professional and clear British voice
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } },
          },
        },
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioData) {
        throw new Error('No audio data received from AI.');
      }

      return audioData;

  } catch (error) {
    console.error("Error generating reference audio:", error);
    throw new Error("Failed to generate reference audio.");
  }
};