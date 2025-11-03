import React, { useState, useEffect } from 'react';
import * as authService from '../services/authService';

// Simple admin password, in a real app this would be more secure.
const ADMIN_PASSWORD = 'supersecretadmin';

export const AdminPage: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');

    const [codes, setCodes] = useState<authService.ActivationCodeStore>({ used: {} });

    useEffect(() => {
        if (isAuthenticated) {
            const currentCodes = authService.getAllActivationCodes();
            setCodes(currentCodes);
        }
    }, [isAuthenticated]);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            setAuthError('');
        } else {
            setAuthError('密码错误。');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center p-4">
                <div className="max-w-sm w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                    <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">管理员登录</h1>
                    <form onSubmit={handlePasswordSubmit}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入管理员密码"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        {authError && <p className="text-red-500 text-sm mt-2 text-center">{authError}</p>}
                        <button type="submit" className="w-full mt-4 px-4 py-2 bg-orange-600 text-white font-semibold rounded-md hover:bg-orange-700 transition-colors">
                            登录
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const usedCodesCount = Object.keys(codes.used).length;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-8">
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center">激活码使用记录</h1>

                <section>
                    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">已用激活码 ({usedCodesCount})</h2>
                     <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg max-h-[70vh] overflow-y-auto">
                        {usedCodesCount > 0 ? (
                            <ul className="space-y-3">
                                {/* FIX: Explicitly cast the result of Object.entries to ensure correct type inference for sort and map callbacks. */}
                                {(Object.entries(codes.used) as [string, authService.UsedCodeInfo][])
                                  .sort(([, a], [, b]) => b.activationTimestamp - a.activationTimestamp) // Show most recent first
                                  .map(([code, info]) => (
                                    <li key={code} className="p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                                        <div className="flex justify-between items-center font-mono">
                                            <span className="text-gray-500 dark:text-gray-400 line-through text-lg">{code}</span>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${code.length === 3 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                                                {code.length === 3 ? '月卡' : '年卡'}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                                            <p><strong>使用者:</strong> {info.userIdentifier}</p>
                                            <p><strong>激活于:</strong> {new Date(info.activationTimestamp).toLocaleString()}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">还没有任何激活码被使用。</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};
