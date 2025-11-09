import React, { useState, useEffect, useRef } from 'react';
import { PracticeItem, PracticeLevel, EvaluationResult } from '../types';
import { SpeakerIcon, MicIcon, StopIcon, LoadingIcon } from './Icons';
import { ScoreDisplay } from './ScoreDisplay';

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
  const refAudioRef = useRef<HTMLAudioElement | null>(null);

  // When the practice item changes, stop any currently playing audio.
  useEffect(() => {
    if (refAudioRef.current) {
      refAudioRef.current.pause();
      setIsPlayingRef(false);
    }
    // This effect ensures audio from a previous item doesn't continue playing.
    return () => {
      if (refAudioRef.current) {
        refAudioRef.current.pause();
        refAudioRef.current = null;
      }
    };
  }, [item]);

  const handlePlayReferenceAudio = () => {
    // If audio is currently playing, pause it and reset.
    if (isPlayingRef && refAudioRef.current) {
      refAudioRef.current.pause();
      refAudioRef.current.currentTime = 0;
      setIsPlayingRef(false);
      return;
    }

    // Ensure there's a local audio file URL to play.
    if (!item.refAudioUrl) {
      alert('此项目没有提供示范音频文件。');
      return;
    }

    // Use the existing audio element if it's for the same URL, otherwise create a new one.
    if (refAudioRef.current && refAudioRef.current.src.endsWith(item.refAudioUrl)) {
      refAudioRef.current.play().catch(e => console.error("Audio playback failed", e));
    } else {
      const audio = new Audio(item.refAudioUrl);
      refAudioRef.current = audio;

      audio.onplaying = () => setIsPlayingRef(true);
      audio.onpause = () => setIsPlayingRef(false);
      audio.onended = () => {
        setIsPlayingRef(false);
        audio.currentTime = 0; // Reset for next play
      };
      audio.onerror = (e) => {
        console.error(`Error playing audio file: ${item.refAudioUrl}`, e);
        alert('播放示范音频时出错。请检查 public 文件夹中的文件是否存在。');
        setIsPlayingRef(false);
      };

      audio.play().catch(e => {
        console.error("Audio playback failed", e);
        setIsPlayingRef(false);
      });
    }
  };


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
                    请朗读单词测评发音: <strong className="font-semibold text-orange-600 dark:text-orange-400">{item.exampleWord}</strong>
                </p>
            </div>
          )}
        </div>
        
        <div className="mt-8 flex justify-center items-center gap-12">
            <button
                onClick={handlePlayReferenceAudio}
                disabled={isRecording}
                className="flex items-center gap-2 text-lg font-semibold text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors disabled:opacity-50"
            >
                <SpeakerIcon className="w-6 h-6"/>
                <span>{isPlayingRef ? '暂停' : '听示范'}</span>
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