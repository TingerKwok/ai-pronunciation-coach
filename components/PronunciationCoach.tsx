import React, { useState, useEffect } from 'react';
import { PracticeLevel, PracticeItem, EvaluationResult, PhonemeSuperCategory } from '../types';
import { PRACTICE_DATA } from '../constants';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import * as xunfeiService from '../services/xunfeiService';

import { PhonemePath } from './LevelPath';
import { PracticeCard } from './PracticeCard';
import { LoadingIcon } from './Icons';

const phonemeData = PRACTICE_DATA[PracticeLevel.Phonemes] as PhonemeSuperCategory[];

export const PronunciationCoach: React.FC = () => {
  // 视图现在直接从音标关卡选择开始
  const [view, setView] = useState<'phoneme_level' | 'practice'>('phoneme_level');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [score, setScore] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

  useEffect(() => {
    // 效果现在只依赖于选择的分类
    if (selectedCategory) {
      const superCategory = phonemeData.find(sup => 
        sup.categories.some(cat => cat.title === selectedCategory)
      );
      const category = superCategory?.categories.find(cat => cat.title === selectedCategory);
      setPracticeItems(category?.items || []);
      setCurrentItemIndex(0);
      setView('practice');
    }
  }, [selectedCategory]);
  
  const handleCategorySelect = (category: string) => {
    setError(null);
    setScore(null);
    setSelectedCategory(category);
  };
  
  const handleBack = () => {
    // 简化的返回逻辑：从练习界面总是返回到音标选择界面
    if (view === 'practice') {
      setView('phoneme_level');
      setPracticeItems([]);
      setSelectedCategory(null);
    }
    setError(null);
    setScore(null);
  };

  const handleSelectItem = (index: number) => {
    if (index >= 0 && index < practiceItems.length) {
      setError(null);
      setScore(null);
      setCurrentItemIndex(index);
    }
  };

  const handleStartRecording = async () => {
    // 游客限制检查已移除
    setError(null);
    setScore(null);
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
      setIsLoading(true);
      setLoadingMessage('专业 AI 引擎正在分析您的发音...');
      try {
        const currentItem = practiceItems[currentItemIndex];
        const result = await xunfeiService.getPronunciationScore(
          audioData.base64,
          audioData.mimeType,
          currentItem,
          PracticeLevel.Phonemes // 硬编码为音标练习
        );
        setScore(result);
      } catch (err: any)
      {
        setError(err.message || '评分时发生错误。');
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
    }
  };

  const currentItem = practiceItems[currentItemIndex];
  
  const renderContent = () => {
    // 'level' 视图已移除，直接从音标选择开始
    if (view === 'phoneme_level') {
        return <PhonemePath 
            phonemeData={phonemeData}
            onSelectCategory={handleCategorySelect}
        />
    }

    if (view === 'practice' && currentItem) {
      return (
        <PracticeCard
          item={currentItem}
          level={PracticeLevel.Phonemes}
          isRecording={isRecording}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
          score={score}
          error={error}
          allItems={practiceItems}
          currentIndex={currentItemIndex}
          onSelectItem={handleSelectItem}
          categoryTitle={selectedCategory || ''}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onBack={handleBack}
        />
      );
    }
    
    return <div className="flex justify-center items-center h-64"><LoadingIcon className="w-10 h-10 text-orange-500" /></div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <header className="p-4 flex justify-center items-center bg-white dark:bg-gray-800/50 backdrop-blur-sm shadow-sm sticky top-0 z-10">
            <h1 className="text-xl font-bold text-orange-600 dark:text-orange-400">音标发音练习</h1>
        </header>
        <main className="p-4">
            {renderContent()}
        </main>
    </div>
  );
};