import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../App';
import { PracticeLevel, PracticeItem, ScoreResult, PhonemeSuperCategory } from '../types';
import { PRACTICE_DATA } from '../constants';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import * as baiduAiService from '../services/baiduAiService';

import { LevelPath, PhonemePath } from './LevelPath';
import { PracticeCard } from './PracticeCard';
import { LoadingIcon } from './Icons';

interface PronunciationCoachProps {
  user: User | null;
  onLoginRequest: () => void;
  onLogout: () => void;
}

const GUEST_PRACTICE_LIMIT = 5;

const phonemeData = PRACTICE_DATA[PracticeLevel.Phonemes] as PhonemeSuperCategory[];
const allPhonemeCategories = phonemeData.flatMap(sup => sup.categories.map(cat => cat.title));

export const PronunciationCoach: React.FC<PronunciationCoachProps> = ({ user, onLoginRequest, onLogout }) => {
  const [view, setView] = useState<'level' | 'phoneme_level' | 'practice'>('level');
  const [selectedLevel, setSelectedLevel] = useState<PracticeLevel | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userAudio, setUserAudio] = useState<{ url: string; base64: string, mimeType: string } | null>(null);
  
  const [guestPracticeCount, setGuestPracticeCount] = useState(() => {
    const savedCount = localStorage.getItem('guestPracticeCount');
    return savedCount ? parseInt(savedCount, 10) : 0;
  });

  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

  const unlockedLevels = Object.values(PracticeLevel);
  const unlockedPhonemeCategories = allPhonemeCategories;


  useEffect(() => {
    if (selectedLevel) {
      if (selectedLevel === PracticeLevel.Phonemes) {
        if (selectedCategory) {
          const superCategory = phonemeData.find(sup => 
            sup.categories.some(cat => cat.title === selectedCategory)
          );
          const category = superCategory?.categories.find(cat => cat.title === selectedCategory);
          setPracticeItems(category?.items || []);
          setCurrentItemIndex(0);
          setView('practice');
        }
      } else {
        setPracticeItems(PRACTICE_DATA[selectedLevel]);
        setCurrentItemIndex(0);
        setView('practice');
      }
    }
  }, [selectedLevel, selectedCategory]);
  
  useEffect(() => {
    if (!user) {
      localStorage.setItem('guestPracticeCount', guestPracticeCount.toString());
    }
  }, [guestPracticeCount, user]);

  const handleLevelSelect = (level: PracticeLevel) => {
    setError(null);
    setScore(null);
    setUserAudio(null);
    if (level === PracticeLevel.Phonemes) {
      setSelectedLevel(level);
      setView('phoneme_level');
    } else {
      setSelectedLevel(level);
    }
  };
  
  const handleCategorySelect = (category: string) => {
    setError(null);
    setScore(null);
    setUserAudio(null);
    setSelectedCategory(category);
  };
  
  const handleBack = () => {
    if (view === 'practice') {
      if (selectedLevel === PracticeLevel.Phonemes) {
        setView('phoneme_level');
      } else {
        setView('level');
        setSelectedLevel(null);
      }
      setPracticeItems([]);
      setSelectedCategory(null);
    } else if (view === 'phoneme_level') {
      setView('level');
      setSelectedLevel(null);
    }
    setError(null);
    setScore(null);
    setUserAudio(null);
  };

  const handleSelectItem = (index: number) => {
    if (index >= 0 && index < practiceItems.length) {
      setError(null);
      setScore(null);
      setUserAudio(null);
      setCurrentItemIndex(index);
    }
  };

  const handleStartRecording = async () => {
    if (!user && guestPracticeCount >= GUEST_PRACTICE_LIMIT) {
        setError(`游客体验次数已达上限 (${GUEST_PRACTICE_LIMIT}次)。请登录以无限次练习。`);
        return;
    }
    setError(null);
    setScore(null);
    setUserAudio(null);
    try {
      await startRecording();
    } catch (err) {
      console.error(err);
      setError('无法访问麦克风。请检查浏览器权限。');
    }
  };

  const handleStopRecording = async () => {
    const audioData = await stopRecording();
    if (audioData) {
      setUserAudio(audioData);
      setIsLoading(true);
      setLoadingMessage('AI 正在为您评分...');
      try {
        if (!selectedLevel) throw new Error("No level selected");
        const currentItem = practiceItems[currentItemIndex];
        const result = await baiduAiService.getPronunciationScore(
          audioData.base64,
          audioData.mimeType,
          currentItem,
          selectedLevel
        );
        setScore(result);
        if(!user) {
            setGuestPracticeCount(prev => prev + 1);
        }
      } catch (err: any) {
        setError(err.message || '评分时发生错误。');
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
    }
  };

  const currentItem = practiceItems[currentItemIndex];
  
  const renderContent = () => {
    if (view === 'level') {
      return <LevelPath unlockedLevels={unlockedLevels} onSelectLevel={handleLevelSelect} />;
    }
    
    if (view === 'phoneme_level') {
        return <PhonemePath 
            phonemeData={phonemeData}
            unlockedCategories={unlockedPhonemeCategories}
            onSelectCategory={handleCategorySelect}
            onBack={handleBack}
        />
    }

    if (view === 'practice' && currentItem) {
      return (
        <PracticeCard
          item={currentItem}
          level={selectedLevel!}
          isRecording={isRecording}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
          score={score}
          error={error}
          // FIX: Removed obsolete `userAudioUrl` prop which is not defined in PracticeCardProps.
          allItems={practiceItems}
          currentIndex={currentItemIndex}
          onSelectItem={handleSelectItem}
          categoryTitle={selectedCategory || ''}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onBack={handleBack}
          isGuest={!user}
          guestPracticeCount={guestPracticeCount}
          guestPracticeLimit={GUEST_PRACTICE_LIMIT}
        />
      );
    }
    
    return <div className="flex justify-center items-center h-64"><LoadingIcon className="w-10 h-10 text-orange-500" /></div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <header className="p-4 flex justify-between items-center bg-white dark:bg-gray-800/50 backdrop-blur-sm shadow-sm sticky top-0 z-10">
            <h1 className="text-xl font-bold text-orange-600 dark:text-orange-400">AI 发音教练</h1>
            <div>
                {user ? (
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300">欢迎, {user.identifier}</span>
                        <button onClick={onLogout} className="px-4 py-2 text-sm font-semibold text-orange-600 dark:text-orange-400 border border-orange-600 dark:border-orange-400 rounded-md hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors">
                            退出登录
                        </button>
                    </div>
                ) : (
                    <button onClick={onLoginRequest} className="px-4 py-2 text-sm font-semibold bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors">
                        登录 / 注册
                    </button>
                )}
            </div>
        </header>
        <main className="p-4">
            {renderContent()}
        </main>
    </div>
  );
};