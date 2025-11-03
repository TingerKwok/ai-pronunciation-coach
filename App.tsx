import React, { useState, useEffect } from 'react';
import { PronunciationCoach } from './components/PronunciationCoach';
import { LoginPage } from './components/LoginPage';
import { VerificationPage } from './components/VerificationPage';
import * as authService from './services/authService';
import { LoadingIcon } from './components/Icons';

export type User = {
  identifier: string;
};

type View = 'loading' | 'login' | 'verify' | 'app';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isActivated, setIsActivated] = useState(false);
  const [view, setView] = useState<View>('loading');

  useEffect(() => {
    // Check for an existing session when the app loads
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      const activationStatus = authService.isUserActivated(currentUser.identifier);
      setIsActivated(activationStatus);
      if (activationStatus) {
        setView('app');
      } else {
        setView('verify');
      }
    } else {
      // User is a guest, show them the full app directly.
      setUser(null);
      setIsActivated(false);
      setView('app');
    }
  }, []);

  const handleLoginRequest = () => setView('login');

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    const activationStatus = authService.isUserActivated(loggedInUser.identifier);
    setIsActivated(activationStatus);
    if (activationStatus) {
      setView('app');
    } else {
      setView('verify');
    }
  };

  const handleVerificationSuccess = () => {
    setIsActivated(true);
    setView('app');
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsActivated(false);
    // Guest practice count is handled within the coach component.
    setView('app');
  };

  const renderView = () => {
    switch (view) {
      case 'loading':
        return (
          <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
            <LoadingIcon className="w-12 h-12 text-orange-500" />
          </div>
        );
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case 'verify':
        // User must exist to be in this state, so user! is safe.
        return <VerificationPage userIdentifier={user!.identifier} onVerificationSuccess={handleVerificationSuccess} />;
      case 'app':
         // This view now serves both guests (user=null) and logged-in members.
        return <PronunciationCoach user={user} onLoginRequest={handleLoginRequest} onLogout={handleLogout} />;
      default:
        // Fallback to the main app as a guest
        return <PronunciationCoach user={null} onLoginRequest={handleLoginRequest} onLogout={handleLogout} />;
    }
  };
  
  return <>{renderView()}</>;
}

export default App;