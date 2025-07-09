


import React, { useState, useEffect } from 'react';
import firebase, { auth } from './firebase';
import { User as FirebaseUser } from 'firebase/auth';

import { Page, EyeAnalysisResult, HealthData } from './types';
import { EyeIcon } from './constants';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { ExamPage } from './pages/ExamPage';
import { ResultsPage } from './pages/ResultsPage';
import { PaymentPage } from './pages/PaymentPage';
import { HistoryPage } from './pages/HistoryPage';
import { useLanguage } from './contexts/LanguageContext';
import { LanguageSwitcher } from './components/common/LanguageSwitcher';
import { Button } from './components/common/Button';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [analysisResults, setAnalysisResults] = useState<EyeAnalysisResult[] | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setAnalysisResults(null);
      setHealthData(null);
      setCapturedImage(null);
      setIsPaymentComplete(false); // Reset payment status on sign out
      setCurrentPage(Page.Home);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const renderPage = () => {
    if (isAuthLoading) {
      return (
        <div className="flex justify-center items-center h-full pt-20">
            <EyeIcon className="w-16 h-16 text-primary animate-pulse" />
        </div>
      );
    }

    switch (currentPage) {
      case Page.Home:
        return <HomePage setCurrentPage={setCurrentPage} />;
      
      case Page.Auth:
        if (currentUser) {
            setCurrentPage(Page.Exam);
            return null; // Redirect logged-in users away from Auth page
        }
        return <AuthPage setCurrentPage={setCurrentPage} />;

      case Page.Exam:
        if (!currentUser) {
          setCurrentPage(Page.Auth);
          return null;
        }
        return (
          <ExamPage
            setCurrentPage={setCurrentPage}
            setAnalysisResults={setAnalysisResults}
            setHealthData={setHealthData}
            healthData={healthData}
            setCapturedImage={setCapturedImage}
            currentUser={currentUser}
          />
        );
      case Page.Results:
        if (!currentUser) {
          setCurrentPage(Page.Auth);
          return null;
        }
        return (
          <ResultsPage
            setCurrentPage={setCurrentPage}
            analysisResults={analysisResults}
            currentUser={currentUser}
            healthData={healthData}
            capturedImage={capturedImage}
            isPaymentComplete={isPaymentComplete}
          />
        );
       case Page.History:
        if (!currentUser) {
          setCurrentPage(Page.Auth);
          return null;
        }
        return <HistoryPage currentUser={currentUser} />;
      case Page.Payment:
        if (!currentUser) {
          setCurrentPage(Page.Auth);
          return null;
        }
        return <PaymentPage setCurrentPage={setCurrentPage} setIsPaymentComplete={setIsPaymentComplete} />;
      default:
        return <HomePage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-light">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setCurrentPage(Page.Home)}
            aria-label={t('appName')}
          >
            <EyeIcon className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-primary">{t('appName')}</span>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            {isAuthLoading ? (
              <div className="w-32 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
            ) : currentUser ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                 <button 
                  onClick={() => setCurrentPage(Page.History)}
                  className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  {t('header_myResultsLink')}
                </button>
                <span className="text-sm text-gray-600 hidden sm:inline" title={currentUser.email || ''}>
                  {t('header_welcomeMessage', { email: currentUser.displayName?.split(' ')[0] || 'User' })}
                </span>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="px-3 py-1.5"
                >
                  {t('header_logoutButton')}
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setCurrentPage(Page.Auth)}
                variant="primary"
                className="text-sm px-3 py-1.5"
              >
                {t('header_loginRegisterButton')}
              </Button>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-grow">
        {renderPage()}
      </main>

      <footer className="bg-neutral-dark text-neutral-light py-8 text-center mt-auto">
        <div className="container mx-auto px-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} {t('footerText')} {t('footerDisclaimer')}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;