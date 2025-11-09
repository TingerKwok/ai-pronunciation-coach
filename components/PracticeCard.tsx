import React, { useState, useEffect, useRef } from 'react';
import { PracticeItem, PracticeLevel, EvaluationResult } from '../types';
import { SpeakerIcon, MicIcon, StopIcon, LoadingIcon } from './Icons';
import { ScoreDisplay } from './ScoreDisplay';
import * as xunfeiService from '../services/xunfeiService';

interface PracticeCardProps {
  item: PracticeItem;
  level: PracticeLevel;
  isRecording: boolean;
  isLoading: boolean;
  loadingMessage: string;
  score: EvaluationResult | null;
  error: string | null;
  allItems: PracticeItem[];
  currentIndex: number;
  onSelectItem: (index: number) => void;
  categoryTitle: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onBack: () => void;
}

export const PracticeCard: React.FC<PracticeCardProps> = ({
  item,
  level,
  isRecording,
  isLoading,
  loadingMessage,
  score,
  error,
  allItems,
  currentIndex,
  onSelectItem,
  categoryTitle,
  onStartRecording,
  onStopRecording,
  onBack,
}) => {
  const [isPlayingRef, setIsPlayingRef] = useState(false);
  const [isRefAudioLoading, setIsRefAudioLoading] = useState(false);
  const refAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());

  // Effect to stop audio and clean up when the practice item changes
  useEffect(() => {
    if (refAudioRef.current) {
        refAudioRef.current.pause();
        refAudioRef.current.src = '';
    }
    setIsPlayingRef(false);
  }, [item]);
  
  // Cleanup audio resources on component unmount
  useEffect(() => {
    const audioCache = audioCacheRef.current;
    return () => {
      if (refAudioRef.current) {
          refAudioRef.current.pause();
      }
      // Revoke all created blob URLs to prevent memory leaks
      audioCache.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handlePlayReferenceAudio = async () => {
    if (isPlayingRef) {
      refAudioRef.current?.pause();
      setIsPlayingRef(false);
      return;
    }

    const cacheKey = item.speakableText || item.text;
    
    if (audioCacheRef.current.has(cacheKey)) {
        const audioSrc = audioCacheRef.current.get(cacheKey)!;
        playAudio(audioSrc);
        return;
    }

    setIsRefAudioLoading(true);
    try {
        const textToSpeak = item.speakableText || item.text;
        const audioBase64 = await xunfeiService.getTtsAudio(textToSpeak);
        
        // Convert base64 to blob and create a URL
        const audioBlob = await (await fetch(`data:audio/mpeg;base64,${audioBase64}`)).blob();
        const audioSrc = URL.createObjectURL(audioBlob);
        
        // Store in cache
        audioCacheRef.current.set(cacheKey, audioSrc);
        
        playAudio(audioSrc);
    } catch (err: any) {
        console.error(`Failed to play reference audio via TTS:`, err);
        // Display the specific error from the service to the user.
        alert(`无法播放示范音频: ${err.message}`);
        setIsPlayingRef(false);
    } finally {
        setIsRefAudioLoading(false);
    }
  };

  const playAudio = async (src: string) => {
    if (!refAudioRef.current) {
        refAudioRef.current = new Audio();
    }
    const audio = refAudioRef.current;
    
    audio.onended = () => {
      setIsPlayingRef(false);
    };
    audio.onerror = (e) => {
      console.error("Audio playback error:", e);
      alert('音频播放失败，请检查网络或浏览器设置。');
      setIsPlayingRef(false);
    }
    
    audio.src = src;
    try {
      await audio.play();
      setIsPlayingRef(true);
    } catch(err) {
      console.error("Failed to play audio:", err);
      setIsPlayingRef(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{categoryTitle}</h2>
        <button
          onClick={onBack}
          className="px-3 py-1 text-sm font-medium text-orange-600 dark:text-orange-400 border border-orange-600 dark:border-orange-400 rounded-md hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors"
        >
          &larr; 返回音标关卡
        </button>
      </div>

      {level === PracticeLevel.Phonemes && (
        <div className="flex flex-wrap gap-2 mb-6">
          {allItems.map((phonemeItem, index) => (
            <button
              key={index}
              onClick={() => onSelectItem(index)}
              className={`px-4 py-2 text-lg font-mono rounded-md transition-colors
                ${currentIndex === index
                  ? 'bg-orange-500 text-white shadow'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }
              `}
            >
              {phonemeItem.text}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8">
        <h3 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-300 mb-6">开始练习 (Start Practice)</h3>
        
        <div className="text-center">
          <p className="text-5xl md:text-6xl font-bold text-gray-800 dark:text-gray-100 break-words">{item.text}</p>
          {item.ipa !== item.text && (
            <p className="text-2xl text-gray-500 dark:text-gray-400 mt-2 font-mono">{item.ipa}</p>
          )}
          {item.exampleWord && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-lg text-gray-600 dark:text-gray-300">
                    请朗读单词: <strong className="font-semibold text-orange-600 dark:text-orange-400">{item.exampleWord}</strong>
                </p>
            </div>
          )}
        </div>
        
        <div className="mt-8 flex justify-center items-center gap-12">
            <button
                onClick={handlePlayReferenceAudio}
                disabled={isRefAudioLoading || isRecording}
                className="flex items-center gap-2 text-lg font-semibold text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors disabled:opacity-50"
            >
                {isRefAudioLoading ? <LoadingIcon className="w-6 h-6"/> : <SpeakerIcon className="w-6 h-6"/>}
                <span>听示范</span>
            </button>
            <button
                onClick={isRecording ? onStopRecording : onStartRecording}
                disabled={isLoading}
                className={`w-28 h-28 rounded-full flex flex-col items-center justify-center text-white shadow-lg transition-all transform hover:scale-105 disabled:opacity-75 disabled:cursor-not-allowed
                ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-600 hover:bg-orange-700'}
                `}
            >
                {isRecording ? <StopIcon className="w-12 h-12" /> : <MicIcon className="w-12 h-12" />}
            </button>
        </div>
        
        {isLoading && (
            <div className="text-center my-4 p-4 bg-orange-50 dark:bg-gray-700/50 rounded-lg">
                <LoadingIcon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-300">{loadingMessage}</p>
            </div>
        )}
        
        {error && !isLoading && (
            <div className="my-4 p-4 bg-red-50 dark:bg-red-900/50 rounded-lg border border-red-200 dark:border-red-700 text-center">
                <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
        )}

        {score && !isLoading && !error && <ScoreDisplay result={score} />}
      </div>
    </div>
  );
};