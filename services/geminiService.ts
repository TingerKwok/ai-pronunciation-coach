import { GoogleGenAI, Modality, Type } from "@google/genai";
import { PracticeItem, PracticeLevel, ScoreResult } from '../types';

// FIX: Initialize the Google Gemini AI client using the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Generates text-to-speech audio for the given text.
 * @param text The text to convert to speech.
 * @returns A base64 encoded audio string.
 */
export const getTextToSpeechAudio = async (text: string): Promise<string> => {
  try {
    // FIX: Use the 'gemini-2.5-flash-preview-tts' model for text-to-speech generation as per API guidelines.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // A standard, clear voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data received from API.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Error generating text-to-speech audio:", error);
    throw new Error("Failed to generate reference audio.");
  }
};

/**
 * Gets a pronunciation score and feedback from the Gemini API.
 * @param audioBase64 The base64 encoded user audio.
 * @param audioMimeType The MIME type of the user audio.
 * @param item The practice item being evaluated.
 * @param level The practice level.
 * @returns A promise that resolves to a ScoreResult object.
 */
export const getPronunciationScore = async (
  audioBase64: string,
  audioMimeType: string,
  item: PracticeItem,
  level: PracticeLevel
): Promise<ScoreResult> => {
  // FIX: Use a powerful model like 'gemini-2.5-pro' for nuanced analysis and reliable structured JSON output.
  const model = 'gemini-2.5-pro';

  // For phonemes, providing the example word gives the AI better context for evaluation.
  const referenceText = level === PracticeLevel.Phonemes ? item.exampleWord : item.text;

  const prompt = `
    You are an expert English pronunciation coach for native Chinese speakers.
    A student is practicing their pronunciation.
    The target is "${referenceText}", with the IPA transcription "${item.ipa}".
    Listen to the student's audio recording and evaluate their pronunciation.

    Provide a score from 0 to 100, where 100 is perfect native-like pronunciation.
    Also, provide concise, constructive feedback in both English and Chinese (Simplified), focusing on specific phonemes or words the student can improve. If the pronunciation is good, offer encouragement.

    Your response MUST be a valid JSON object with two keys: "score" (an integer) and "feedback" (a string).
    Example response:
    {
      "score": 85,
      "feedback": "Great job! Your rhythm is good. Pay a little more attention to the 'th' sound in 'the'. (干得不错！你的节奏很好。请多加注意 'the' 中的 'th' 音。)"
    }
  `;

  try {
    // FIX: Send a multimodal request with a text prompt and the user's audio data.
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: audioBase64,
                mimeType: audioMimeType,
              },
            },
          ],
        },
      ],
      // FIX: Use responseMimeType and responseSchema to ensure the AI returns a valid JSON object.
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.INTEGER,
              description: 'Pronunciation score from 0 to 100.',
            },
            feedback: {
              type: Type.STRING,
              description: 'Constructive feedback in English and Simplified Chinese.',
            },
          },
          required: ['score', 'feedback'],
        },
      },
    });

    // FIX: Get the response text directly as per guidelines.
    const responseText = response.text.trim();
    if (!responseText) {
        throw new Error("Received an empty response from the AI. The audio might be silent or too quiet.");
    }
    
    const result = JSON.parse(responseText);
    
    if (typeof result.score !== 'number' || typeof result.feedback !== 'string') {
        throw new Error("Invalid JSON structure in AI response.");
    }

    return result as ScoreResult;
  } catch (error) {
    console.error("Error getting pronunciation score:", error);
    let errorMessage = "获取评分时发生错误。请检查您的麦克风是否正常工作，然后重试。(An error occurred while getting the score. Please check if your microphone is working and try again.)";
    if (error instanceof Error) {
        if (error.message.includes("empty response")) {
            errorMessage = "AI 未返回评分。您的录音可能为空或声音太小，请重试。(The AI returned no score. Your recording might be empty or too quiet. Please try again.)";
        } else if (error.message.includes("Invalid JSON")) {
            errorMessage = "AI 返回了无效的评分格式，请重试。(The AI returned an invalid score format. Please try again.)";
        }
    }
    throw new Error(errorMessage);
  }
};
