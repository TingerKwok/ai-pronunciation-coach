import React, { useState, useRef } from 'react';
import { PracticeItem, PracticeLevel } from '../types';
// FIX: Import 'PlayIcon' to resolve reference error.
import { MicIcon, StopIcon, LoadingIcon, SpeakerIcon, PlayIcon } from './Icons';
import { getTextToSpeechAudio } from '../services/geminiService';

interface PracticeCardProps {
  item: PracticeItem;
  isRecording: boolean;
  isLoading: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  userAudioUrl: string | null;
  displayMode: 'default' | 'ipa_only';
  level: PracticeLevel;
}

// --- Helper functions for Web Audio API playback ---

// Decodes a Base64 string to a Uint8Array.
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decodes raw PCM audio data into an AudioBuffer for playback.
async function decodePcmAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const sampleRate = 24000; // Gemini TTS sample rate is 24kHz
  const numChannels = 1;     // Mono audio
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    // Convert 16-bit PCM to Float32 range [-1.0, 1.0]
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}


export const PracticeCard: React.FC<PracticeCardProps> = ({
  item,
  isRecording,
  isLoading,
  startRecording,
  stopRecording,
  userAudioUrl,
  displayMode,
  level,
}) => {
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
  const userAudioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  const playUserAudio = () => {
    if (userAudioRef.current) {
        userAudioRef.current.play();
    }
  }

  const playReferenceAudio = async () => {
    if (isFetchingAudio) return;

    // Initialize AudioContext on first user interaction (e.g., a click)
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;

    setIsFetchingAudio(true);
    try {
      // For phonemes, use the pre-computed speakable text for speed. For others, use the main text.
      const textToSpeak = level === PracticeLevel.Phonemes ? item.speakableText || item.ipa : item.text;
      const base64Audio = await getTextToSpeechAudio(textToSpeak);
      
      const rawAudioData = decode(base64Audio);
      const audioBuffer = await decodePcmAudioData(rawAudioData, audioContext);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();

    } catch (error) {
      console.error("Error playing reference audio:", error);
      alert('获取示范音频失败，请稍后再试。');
    } finally {
      setIsFetchingAudio(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md space-y-4">
      <div className="text-center min-h-[120px] flex flex-col justify-center">
         {displayMode === 'ipa_only' ? (
          <p className="text-5xl md:text-6xl font-mono text-gray-900 dark:text-gray-100">{item.ipa}</p>
        ) : (
          <>
            <p className="text-3xl font-serif text-gray-900 dark:text-gray-100 mb-2">{item.text}</p>
            <p className="text-xl text-gray-500 dark:text-gray-400 font-mono">{item.ipa}</p>
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 pt-4">
         {/* Reference Audio Button */}
        <button
          onClick={playReferenceAudio}
          disabled={isFetchingAudio || isRecording || isLoading}
          className="px-4 py-2 w-36 h-14 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center gap-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isFetchingAudio ? (
            <LoadingIcon className="w-6 h-6" />
          ) : (
            <SpeakerIcon className="w-6 h-6" />
          )}
          <div className="text-left">
            <span className="block font-semibold">听示范</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">(Listen)</span>
          </div>
        </button>

        {/* Recording button */}
        <button
          onClick={handleRecordClick}
          disabled={isLoading || isFetchingAudio}
          className={`flex items-center justify-center w-20 h-20 rounded-full text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 dark:focus:ring-offset-gray-800
            ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400 animate-pulse'
                : 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-400'
            }
            ${(isLoading || isFetchingAudio) ? 'bg-gray-400 cursor-not-allowed' : ''}
          `}
        >
          {isLoading ? (
            <LoadingIcon className="w-10 h-10" />
          ) : isRecording ? (
            <StopIcon className="w-8 h-8" />
          ) : (
            <MicIcon className="w-8 h-8" />
          )}
        </button>

        {/* User audio playback */}
        {userAudioUrl && !isLoading && (
            <>
                <audio ref={userAudioRef} src={userAudioUrl} preload="auto" />
                <button
                    onClick={playUserAudio}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    aria-label="Play your recording"
                >
                    <PlayIcon className="w-7 h-7" />
                </button>
            </>
        )}
      </div>
       {isRecording && <p className="text-center text-red-500 dark:text-red-400 mt-2 animate-pulse">正在录音 (Recording...)</p>}
    </div>
  );
};