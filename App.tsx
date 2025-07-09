
import React, { useState, useEffect } from 'react';
import { Page, User, EyeAnalysisResult } from './types';
import { EyeIcon } from './constants';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { ExamPage } from './pages/ExamPage';
import { ResultsPage } from './pages/ResultsPage';
import { PaymentPage } from './pages/PaymentPage';
import { useLanguage } from './contexts/LanguageContext';
import { LanguageSwitcher } from './components/common/LanguageSwitcher';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [analysisResults, setAnalysisResults] = useState<EyeAnalysisResult[] | null>(null);
  const { t } = useLanguage();

  const renderPage = () => {
    switch (currentPage) {
      case Page.Home:
        return <HomePage setCurrentPage={setCurrentPage} />;
      case Page.Auth:
        return <AuthPage setCurrentPage={setCurrentPage} setCurrentUser={setCurrentUser} />;
      case Page.Exam:
        if (!currentUser) { 
            setCurrentPage(Page.Auth);
            return <AuthPage setCurrentPage={setCurrentPage} setCurrentUser={setCurrentUser} />;
        }
        return <ExamPage setCurrentPage={setCurrentPage} setAnalysisResults={setAnalysisResults} />;
      case Page.Results:
         if (!currentUser || !analysisResults) { 
            setCurrentPage(Page.Exam); 
            return <ExamPage setCurrentPage={setCurrentPage} setAnalysisResults={setAnalysisResults} />;
        }
        return <ResultsPage setCurrentPage={setCurrentPage} analysisResults={analysisResults} />;
      case Page.Payment:
         if (!currentUser) { 
            setCurrentPage(Page.Auth);
            return <AuthPage setCurrentPage={setCurrentPage} setCurrentUser={setCurrentUser} />;
        }
        return <PaymentPage setCurrentPage={setCurrentPage} />;
      default:
        return <HomePage setCurrentPage={setCurrentPage} />;
    }
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setAnalysisResults(null);
    setCurrentPage(Page.Home);
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
          <div className="flex items-center space-x-3">
            <LanguageSwitcher />
            {currentUser ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {t('header_welcomeMessage', { email: currentUser.email })}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-light/10 rounded-md transition-colors"
                >
                  {t('header_logoutButton')}
                </button>
              </div>
            ) : (
              currentPage !== Page.Auth && (
                 <button
                  onClick={() => setCurrentPage(Page.Auth)}
                  className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  {t('header_loginRegisterButton')}
                </button>
              )
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
