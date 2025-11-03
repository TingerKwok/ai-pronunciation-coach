import React, { useRef, useEffect, useState } from 'react';
import { PracticeItem } from '../types';
import { MicIcon, StopIcon, PlayIcon, SpeakerIcon, LoadingIcon } from './Icons';
import { getTextToSpeechAudio } from '../services/geminiService';

// Audio decoding helpers from Gemini guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


interface PracticeCardProps {
  item: PracticeItem;
  isRecording: boolean;
  isLoading: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  userAudioUrl: string | null;
  displayMode: 'default' | 'ipa_only';
}

export const PracticeCard: React.FC<PracticeCardProps> = ({
  item,
  isRecording,
  isLoading,
  startRecording,
  stopRecording,
  userAudioUrl,
  displayMode
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isRefAudioLoading, setIsRefAudioLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (userAudioUrl && audioRef.current) {
      audioRef.current.src = userAudioUrl;
    }
  }, [userAudioUrl]);
  
  const playReferenceAudio = async () => {
    if (isRefAudioLoading) return;
    setIsRefAudioLoading(true);

    try {
      // FIX: The specialized TTS model expects direct text, not complex instructions.
      // For phonemes, we now send the example word which contains the target sound.
      // This provides clear, unambiguous text for the TTS model to synthesize.
      const textToSpeak = displayMode === 'ipa_only' 
        ? item.exampleWord || item.ipa // Prioritize the example word for clarity, fallback to IPA symbol
        : item.text;
      
      const base64Audio = await getTextToSpeechAudio(textToSpeak);

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioContext = audioContextRef.current;

      const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();

    } catch (e) {
      console.error("Error playing reference audio:", e);
      alert("抱歉，无法播放示范音频。请稍后重试。 (Sorry, could not play reference audio. Please try again later.)");
    } finally {
      setIsRefAudioLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="text-center min-h-[120px] flex flex-col justify-center">
        {displayMode === 'ipa_only' ? (
            <p className="text-6xl font-serif text-gray-800 dark:text-gray-200">{item.ipa}</p>
        ) : (
            <>
                <p className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{item.text}</p>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-sans">{item.ipa}</p>
            </>
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
        {/* Reference Audio Button */}
        <button
          onClick={playReferenceAudio}
          disabled={isRefAudioLoading}
          className="flex items-center justify-center w-36 gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRefAudioLoading ? <LoadingIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
          听示范 (Listen)
        </button>

        {/* Recording Control Button */}
        <div className="relative">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-orange-500 hover:bg-orange-600'
              } text-white disabled:bg-gray-400 dark:disabled:bg-gray-600`}
            >
              {isLoading ? (
                <LoadingIcon className="w-8 h-8" />
              ) : isRecording ? (
                <StopIcon className="w-8 h-8" />
              ) : (
                <MicIcon className="w-8 h-8" />
              )}
            </button>
            {isRecording && <div className="absolute inset-0 rounded-full bg-red-500/50 animate-ping -z-10"></div>}
        </div>

        {/* User Audio Playback */}
        {userAudioUrl ? (
          <button
            onClick={() => audioRef.current?.play()}
            className="flex items-center justify-center w-36 gap-2 px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400 border border-green-600 dark:border-green-400 rounded-md hover:bg-green-50 dark:hover:bg-gray-700 transition-colors"
          >
            <PlayIcon className="w-5 h-5" />
            听录音 (Playback)
          </button>
        ) : (
            <div className="w-36"></div> // Placeholder to maintain layout
        )}
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  );
};