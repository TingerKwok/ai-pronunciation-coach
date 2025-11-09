import React, { useState } from 'react';
import * as authService from '../services/authService';
// Fix: Import User from types.ts instead of App.tsx
import { User } from '../types';
import { LoadingIcon } from './Icons';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegistering) {
      if (password !== confirmPassword) {
        setError('两次输入的密码不匹配。');
        return;
      }
      if (password.length < 6) {
        setError('密码长度至少需要6位。');
        return;
      }
    }
    
    setIsLoading(true);
    try {
      const user = isRegistering
        ? await authService.register(identifier, password)
        : await authService.login(identifier, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError(null);
    setIdentifier('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {isRegistering ? '创建新账户' : '欢迎回来'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {isRegistering ? '加入我们，开始您的发音练习之旅。' : '登录以继续您的发音练习之旅。'}
            </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              手机号
            </label>
            <div className="mt-1">
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                placeholder="请输入您的手机号"
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
                autoComplete={isRegistering ? "new-password" : "current-password"}
                required
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          
          {isRegistering && (
            <div>
              <label htmlFor="confirm-password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                确认密码
              </label>
              <div className="mt-1">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          )}
          
          {error && <p className="text-center text-red-500 text-sm">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center px-6 py-3 font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-orange-400"
            >
              {isLoading ? <LoadingIcon className="w-6 h-6" /> : (isRegistering ? '注册' : '登录')}
            </button>
          </div>
        </form>
         <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              {isRegistering ? '已有账户？' : '还没有账户？'}
              <button onClick={toggleMode} className="font-medium text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300 ml-1">
                {isRegistering ? '立即登录' : '立即注册'}
              </button>
            </p>
         </div>
      </div>
    </div>
  );
};