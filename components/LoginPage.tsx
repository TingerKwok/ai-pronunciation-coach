import React, { useState } from 'react';
import * as authService from '../services/authService';
import { User } from '../App';
import { LoadingIcon } from './Icons';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('user@example.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const user = await authService.login(identifier, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">欢迎回来</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">登录以继续您的发音练习之旅。</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              邮箱
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              密码
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          
          {error && <p className="text-center text-red-500 text-sm">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center px-6 py-3 font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-orange-400"
            >
              {isLoading ? <LoadingIcon className="w-6 h-6" /> : '登录'}
            </button>
          </div>
        </form>
         <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>测试账户: user@example.com / password123</p>
         </div>
      </div>
    </div>
  );
};
