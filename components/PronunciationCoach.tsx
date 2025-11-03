import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PRACTICE_DATA } from '../constants';
import { PracticeLevel, PracticeItem, ScoreResult, PhonemeSuperCategory } from '../types';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { getPronunciationScore } from '../services/geminiService';
import { PracticeCard } from './PracticeCard';
import { ScoreDisplay } from './ScoreDisplay';
import { LevelPath, PhonemePath } from './LevelPath';
import { User } from '../App';

interface PronunciationCoachProps {
  user: User | null;
  onLoginRequest: () => void;
  onLogout: () => void;
}

const levelOrder = [PracticeLevel.Phonemes, PracticeLevel.Words, PracticeLevel.Phrases, PracticeLevel.Sentences];

export const PronunciationCoach: React.FC<PronunciationCoachProps> = ({ user, onLoginRequest, onLogout }) => {
  const isGuest = user === null;
  const [view, setView] = useState<'path' | 'practice'>('path');
  const [unlockedLevels, setUnlockedLevels] = useState<PracticeLevel[]>([PracticeLevel.Phonemes]);
  const [selectedLevel, setSelectedLevel] = useState<PracticeLevel | null>(null);
  
  const allPhonemeCategories = useMemo(() => 
    PRACTICE_DATA[PracticeLevel.Phonemes].flatMap(superCat => superCat.categories.map(cat => cat.title)),
    []
  );
  const [unlockedPhonemeCategories, setUnlockedPhonemeCategories] = useState<string[]>([allPhonemeCategories[0]]);
  const [selectedPhonemeCategory, setSelectedPhonemeCategory] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<PracticeItem | null>(null);
  const [userAudio, setUserAudio] = useState<{ url: string; base64: string; mimeType: string; } | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isRecording, startRecording, stopRecording } = useAudioRecorder();
  const recordingTimeoutRef = useRef<number | null>(null);


  // --- Guest Mode State and Logic ---
  const [guestPracticeCount, setGuestPracticeCount] = useState(() => {
    if (!isGuest) return 0;
    return parseInt(localStorage.getItem('guestPracticeCount') || '0', 10);
  });
  
  // Clear guest count on logout
  useEffect(() => {
    if (isGuest) {
      setGuestPracticeCount(parseInt(localStorage.getItem('guestPracticeCount') || '0', 10));
    } else {
      localStorage.removeItem('guestPracticeCount');
      setGuestPracticeCount(0);
    }
  }, [isGuest]);


  const handleStartRecording = () => {
    if (isGuest && guestPracticeCount >= 5) {
      alert('您已完成5次免费练习，请登录以解锁全部功能。');
      onLoginRequest();
      return;
    }
    startRecording();
    // Automatically stop recording after 5 seconds
    recordingTimeoutRef.current = window.setTimeout(() => {
      handleStopRecording();
    }, 5000);
  };
  
  const handleStopRecording = async () => {
    // Clear the auto-stop timeout if the user stops manually
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    const audioData = await stopRecording();
    if (audioData && selectedItem && selectedLevel) {
      setUserAudio(audioData);
      setIsLoading(true);
      setError(null);
      setScoreResult(null);
      try {
        const result = await getPronunciationScore(audioData.base64, audioData.mimeType, selectedItem, selectedLevel);
        setScoreResult(result);

        if (isGuest) {
            const newCount = guestPracticeCount + 1;
            setGuestPracticeCount(newCount);
            localStorage.setItem('guestPracticeCount', newCount.toString());
        } else {
            // Unlock logic for registered users
            if (selectedLevel === PracticeLevel.Phonemes && selectedPhonemeCategory) {
                const currentIndex = allPhonemeCategories.indexOf(selectedPhonemeCategory);
                if (currentIndex < allPhonemeCategories.length - 1) {
                    const nextCategory = allPhonemeCategories[currentIndex + 1];
                    if (!unlockedPhonemeCategories.includes(nextCategory)) {
                        setUnlockedPhonemeCategories(prev => [...prev, nextCategory]);
                    }
                } else {
                    const currentMainIndex = levelOrder.indexOf(PracticeLevel.Phonemes);
                    if (currentMainIndex < levelOrder.length - 1) {
                        const nextLevel = levelOrder[currentMainIndex + 1];
                        if (!unlockedLevels.includes(nextLevel)) {
                            setUnlockedLevels(prev => [...prev, nextLevel]);
                        }
                    }
                }
            } else if (selectedLevel) {
                const currentIndex = levelOrder.indexOf(selectedLevel);
                if (currentIndex < levelOrder.length - 1) {
                    const nextLevel = levelOrder[currentIndex + 1];
                    if (!unlockedLevels.includes(nextLevel)) {
                        setUnlockedLevels(prev => [...prev, nextLevel]);
                    }
                }
            }
        }

      } catch (err: any) {
        setError(err.message || "获取评分失败，请重试。");
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (view === 'practice' && selectedLevel && !selectedItem) {
      if (selectedLevel === PracticeLevel.Phonemes && selectedPhonemeCategory) {
        const superCat = PRACTICE_DATA[PracticeLevel.Phonemes].find(sc => sc.categories.some(c => c.title === selectedPhonemeCategory));
        const category = superCat?.categories.find(c => c.title === selectedPhonemeCategory);
        if (category?.items[0]) setSelectedItem(category.items[0]);
      } else if (selectedLevel !== PracticeLevel.Phonemes) {
        const data = PRACTICE_DATA[selectedLevel];
        if(Array.isArray(data)) setSelectedItem(data[0]);
      }
    }
  }, [view, selectedLevel, selectedPhonemeCategory, selectedItem]);

  const handleSelectItem = (item: PracticeItem) => {
    setSelectedItem(item);
    setScoreResult(null); setUserAudio(null); setError(null);
  };
  const handleSelectLevel = (level: PracticeLevel) => {
    setSelectedLevel(level); setView('practice'); setSelectedItem(null); 
    setSelectedPhonemeCategory(null); setScoreResult(null); setUserAudio(null); setError(null);
  };
  const handleSelectPhonemeCategory = (category: string) => {
    setSelectedPhonemeCategory(category); setSelectedItem(null);
    setScoreResult(null); setUserAudio(null); setError(null);
  }
  const handleBack = () => {
    if (selectedPhonemeCategory) setSelectedPhonemeCategory(null);
    else { setView('path'); setSelectedLevel(null); }
    setSelectedItem(null); setScoreResult(null); setUserAudio(null); setError(null);
  }

  const renderPracticeItems = () => {
    if (!selectedLevel) return null;
    if (selectedLevel === PracticeLevel.Phonemes) {
      if (!selectedPhonemeCategory) return null;
      const allSuperCategories = PRACTICE_DATA[PracticeLevel.Phonemes] as PhonemeSuperCategory[];
      const currentCategory = allSuperCategories.flatMap(sc => sc.categories).find(c => c.title === selectedPhonemeCategory);
      if (!currentCategory) return <p>Category not found.</p>;
      return (<div className="flex flex-wrap gap-2">{(currentCategory.items).map((item, k) => (<button key={k} onClick={() => handleSelectItem(item)} className={`px-3 py-1.5 rounded-md text-sm font-sans transition-colors ${selectedItem?.ipa === item.ipa? 'bg-orange-500 text-white': 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-orange-200 dark:hover:bg-orange-800'}`}>{item.ipa}</button>))}</div>);
    }
    
    return (<div className="flex flex-wrap gap-2">{(PRACTICE_DATA[selectedLevel] as PracticeItem[]).map((item, index) => (<button key={index} onClick={() => handleSelectItem(item)} className={`px-4 py-2 rounded-lg text-left transition-colors ${selectedItem?.text === item.text? 'bg-orange-500 text-white': 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-orange-200 dark:hover:bg-orange-800'}`}>{item.text}</button>))}</div>);
  };
  
  const getPracticeTitle = () => {
    if (selectedLevel === PracticeLevel.Phonemes) return selectedPhonemeCategory || '音标 (Phonemes)';
    const levelMap = { [PracticeLevel.Words]: '单词 (Words)', [PracticeLevel.Phrases]: '短语 (Phrases)', [PracticeLevel.Sentences]: '句子 (Sentences)' };
    return selectedLevel ? levelMap[selectedLevel] : '';
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-orange-600 dark:text-orange-400">AI 发音教练</h1>
            <span className="text-lg text-gray-500 dark:text-gray-400 font-light hidden sm:inline">Pronunciation Coach</span>
          </div>
          {isGuest ? (
             <button onClick={onLoginRequest} className="px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 border border-orange-600 dark:border-orange-400 rounded-md hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors">
                登录 / 注册
             </button>
          ) : (
            <button onClick={onLogout} className="px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 border border-orange-600 dark:border-orange-400 rounded-md hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors">
                退出登录
            </button>
          )}
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {isGuest && (
          <div className="mb-6 p-4 bg-orange-50 dark:bg-gray-800 border border-orange-200 dark:border-gray-700 rounded-lg text-center">
            <p className="text-gray-700 dark:text-gray-300">
              您正在以游客身份体验。您可以自由浏览全部内容，并进行 
              <strong className="text-orange-600 dark:text-orange-400"> {Math.max(0, 5 - guestPracticeCount)} </strong>
              次免费发音练习。
              <button onClick={onLoginRequest} className="ml-2 font-bold text-orange-600 dark:text-orange-400 hover:underline">登录/注册</button> 以解锁无限练习。
            </p>
          </div>
        )}
        {view === 'path' ? (
          <LevelPath unlockedLevels={unlockedLevels} onSelectLevel={handleSelectLevel} />
        ) : (
          selectedLevel === PracticeLevel.Phonemes && !selectedPhonemeCategory ? (
            // FIX: Pass the correct state variable `unlockedPhonemeCategories` to the `unlockedCategories` prop.
            <PhonemePath allCategories={allPhonemeCategories} unlockedCategories={unlockedPhonemeCategories} onSelectCategory={handleSelectPhonemeCategory} onBack={() => { setView('path'); setSelectedLevel(null); }} />
          ) : (
            <>
              <section id="practice-selection" className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">{getPracticeTitle()}</h2>
                    <button onClick={handleBack} className="px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 border border-orange-600 dark:border-orange-400 rounded-md hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors">
                        &larr; {selectedPhonemeCategory ? '返回音标关卡' : '返回主路径'}
                    </button>
                </div>
                <div className="mt-6">{renderPracticeItems()}</div>
              </section>
              <section id="practice-area">
                <h2 className="text-2xl font-bold mb-4">开始练习 (Start Practice)</h2>
                {selectedItem && selectedLevel && (<PracticeCard item={selectedItem} isRecording={isRecording} isLoading={isLoading} startRecording={handleStartRecording} stopRecording={handleStopRecording} userAudioUrl={userAudio?.url ?? null} displayMode={selectedLevel === PracticeLevel.Phonemes ? 'ipa_only' : 'default'} level={selectedLevel} />)}
                {error && <div className="mt-4 text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">{error}</div>}
                {scoreResult && <ScoreDisplay score={scoreResult.score} feedback={scoreResult.feedback} />}
              </section>
            </>
          )
        )}
      </main>
    </div>
  );
};