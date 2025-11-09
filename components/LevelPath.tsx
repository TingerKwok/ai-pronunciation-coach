import React from 'react';
import { PracticeLevel, PhonemeSuperCategory } from '../types';
import { PhonemeIcon, WordIcon, PhraseIcon, SentenceIcon, LockIcon } from './Icons';

interface LevelPathProps {
  unlockedLevels: PracticeLevel[];
  onSelectLevel: (level: PracticeLevel) => void;
}

const levelConfig = {
  [PracticeLevel.Phonemes]: {
    title: '单元 1: 音标',
    subtitle: 'Phonemes',
    Icon: PhonemeIcon,
    color: 'bg-orange-500',
    hover: 'hover:bg-orange-600',
  },
  [PracticeLevel.Words]: {
    title: '单元 2: 单词',
    subtitle: 'Words',
    Icon: WordIcon,
    color: 'bg-green-500',
    hover: 'hover:bg-green-600',
  },
  [PracticeLevel.Phrases]: {
    title: '单元 3: 短语',
    subtitle: 'Phrases',
    Icon: PhraseIcon,
    color: 'bg-blue-500',
    hover: 'hover:bg-blue-600',
  },
  [PracticeLevel.Sentences]: {
    title: '单元 4: 句子',
    subtitle: 'Sentences',
    Icon: SentenceIcon,
    color: 'bg-purple-500',
    hover: 'hover:bg-purple-600',
  },
};

export const LevelPath: React.FC<LevelPathProps> = ({ unlockedLevels, onSelectLevel }) => {
  return (
    <div className="w-full max-w-sm mx-auto py-8">
      <h2 className="text-3xl font-bold text-center mb-10 text-gray-800 dark:text-gray-200">学习路径 (Learning Path)</h2>
      <div className="relative">
        <div className="absolute left-1/2 -translate-x-1/2 top-10 bottom-10 w-1 border-l-2 border-dashed border-gray-300 dark:border-gray-600 -z-10"></div>
        
        <ul className="space-y-16">
          {Object.values(PracticeLevel).map((level) => {
            const isUnlocked = unlockedLevels.includes(level);
            const config = levelConfig[level];

            return (
              <li key={level} className="flex items-center">
                <div className="flex-1 text-right pr-8">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{config.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{config.subtitle}</p>
                </div>

                <div className="relative">
                  <button
                    onClick={() => isUnlocked && onSelectLevel(level)}
                    disabled={!isUnlocked}
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transform transition-transform duration-200 ${
                      isUnlocked
                        ? `${config.color} ${config.hover} hover:scale-105`
                        : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                    }`}
                    aria-label={`Start ${config.subtitle}`}
                  >
                    {isUnlocked ? (
                      <config.Icon className="w-10 h-10" />
                    ) : (
                      <LockIcon className="w-10 h-10 text-gray-200 dark:text-gray-400" />
                    )}
                  </button>
                </div>
                
                <div className="flex-1"></div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

interface PhonemePathProps {
    phonemeData: PhonemeSuperCategory[];
    unlockedCategories: string[];
    onSelectCategory: (category: string) => void;
    onBack?: () => void;
}

const phonemeCategoryConfig: {[key: string]: { color: string, hover: string }} = {
    'Long Vowels (长元音)': { color: 'bg-red-500', hover: 'hover:bg-red-600' },
    'Short Vowels (短元音)': { color: 'bg-orange-500', hover: 'hover:bg-orange-600' },
    'Diphthongs (双元音)': { color: 'bg-yellow-500', hover: 'hover:bg-yellow-600' },
    'Voiceless Consonants (清辅音)': { color: 'bg-blue-500', hover: 'hover:bg-blue-600' },
    'Voiced Consonants (浊辅音)': { color: 'bg-indigo-500', hover: 'hover:bg-indigo-600' },
};

export const PhonemePath: React.FC<PhonemePathProps> = ({ phonemeData, unlockedCategories, onSelectCategory }) => {
    const allCategories = phonemeData.flatMap(sup => sup.categories);

    return (
        <div className="w-full max-w-sm mx-auto py-8">
            <h2 className="text-3xl font-bold text-center mb-10 text-gray-800 dark:text-gray-200">音标关卡</h2>
            <div className="relative">
                <div className="absolute left-1/2 -translate-x-1/2 top-10 bottom-10 w-1 border-l-2 border-dashed border-gray-300 dark:border-gray-600 -z-10"></div>
                
                <ul className="space-y-8">
                    {allCategories.map((category) => {
                        const isUnlocked = unlockedCategories.includes(category.title);
                        const config = phonemeCategoryConfig[category.title] || { color: 'bg-gray-500', hover: 'hover:bg-gray-600' };
                        const [title, subtitle] = category.title.split(' (');

                        return (
                            <li key={category.title} className="flex items-center">
                                <div className="flex-1 text-right pr-6">
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{title}</h3>
                                    <p className="text-gray-500 dark:text-gray-400">({subtitle}</p>
                                </div>

                                <div className="relative">
                                    <button
                                        onClick={() => isUnlocked && onSelectCategory(category.title)}
                                        disabled={!isUnlocked}
                                        className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transform transition-transform duration-200 ${
                                            isUnlocked
                                                ? `${config.color} ${config.hover} hover:scale-105`
                                                : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                                        }`}
                                        aria-label={`Start ${title}`}
                                    >
                                        {isUnlocked ? (
                                            <PhonemeIcon className="w-10 h-10" />
                                        ) : (
                                            <LockIcon className="w-10 h-10 text-gray-200 dark:text-gray-400" />
                                        )}
                                    </button>
                                </div>
                                
                                <div className="flex-1"></div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};
