import React from 'react';
import { MicIcon, SpeakerIcon } from './Icons';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center p-6 text-center">
      <div className="max-w-xl w-full">
        <div className="flex justify-center items-center gap-4 mb-6">
            <SpeakerIcon className="w-12 h-12 text-orange-500" />
            <MicIcon className="w-12 h-12 text-orange-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
          欢迎来到 AI 发音教练
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
          为了获得最佳体验，应用需要使用您的麦克风进行发音练习。我们绝不会在您不知情的情况下录音。
        </p>
        <button
          onClick={onStart}
          className="px-10 py-4 text-xl font-bold bg-orange-600 text-white rounded-lg shadow-lg hover:bg-orange-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-400 dark:focus:ring-orange-600"
        >
          开始练习
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
          点击“开始练习”即表示您同意应用在练习时访问您的麦克风。
        </p>
      </div>
    </div>
  );
};
