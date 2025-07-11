
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './firebase';

import { Page, EyeAnalysisResult, HealthData } from './types';
import { EyeIcon } from './constants';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { ExamPage } from './pages/ExamPage';
import { ResultsPage } from './pages/ResultsPage';
import { PaymentPage } from './pages/PaymentPage';
import { HistoryPage } from './pages/HistoryPage';
import { AdminPage } from './pages/AdminPage';
import { SupportPage } from './pages/SupportPage';
import { useLanguage } from './contexts/LanguageContext';
import { LanguageSwitcher } from './components/common/LanguageSwitcher';
import { Button } from './components/common/Button';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Exam flow state
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<EyeAnalysisResult[] | null>(null);
  const [ophthalmologistSummary, setOphthalmologistSummary] = useState<string>('');
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  
  const [isAdmin, setIsAdmin] = useState(false);
  
  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const idTokenResult = await user.getIdTokenResult(true); 
          setIsAdmin(!!idTokenResult.claims.admin);
        } catch (error) {
          console.error("Error fetching user claims:", error);
          setIsAdmin(false);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setIsAuthLoading(false);
    });

    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('payment_success') === 'true') {
        setIsPaymentComplete(true);
        setCurrentPage(Page.History);
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (queryParams.get('payment_cancelled') === 'true' || queryParams.has('payment_cancel')) {
        setCurrentPage(Page.Exam);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setHealthData(null);
      setCapturedImage(null);
      setAnalysisResults(null);
      setOphthalmologistSummary('');
      setIsPaymentComplete(false);
      setIsAdmin(false);
      setCurrentPage(Page.Home);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const renderPage = () => {
    if (isAuthLoading) {
      return (
        <div className="flex justify-center items-center h-full pt-20">
            <EyeIcon className="w-16 h-16 text-accent animate-pulse" />
        </div>
      );
    }

    switch (currentPage) {
      case Page.Home:
        return <HomePage setCurrentPage={setCurrentPage} />;
      
      case Page.Auth:
        if (currentUser) {
            setCurrentPage(Page.Exam);
            return null;
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
            setOphthalmologistSummary={setOphthalmologistSummary}
            setIsPaymentComplete={setIsPaymentComplete}
            currentUser={currentUser}
            isAdmin={isAdmin}
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
            summary={ophthalmologistSummary}
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
        return <PaymentPage setCurrentPage={setCurrentPage} />;
      case Page.Admin:
        if (!currentUser || !isAdmin) {
          setCurrentPage(Page.Home);
          return null;
        }
        return <AdminPage currentUser={currentUser} />;
      case Page.Support:
        return <SupportPage setCurrentPage={setCurrentPage} />;
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
            <EyeIcon className="w-8 h-8 text-accent" />
            <span className="text-xl font-bold text-primary-dark">{t('appName')}</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <LanguageSwitcher />
            {isAuthLoading ? (
              <div className="w-32 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
            ) : currentUser ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                 <button 
                  onClick={() => setCurrentPage(Page.History)}
                  className="text-sm font-medium text-primary-dark hover:text-accent transition-colors"
                >
                  {t('header_myResultsLink')}
                </button>
                 {isAdmin && (
                  <Button 
                    onClick={() => setCurrentPage(Page.Admin)} 
                    variant="ghost" 
                    size="sm"
                    className="px-3 py-1.5"
                  >
                    {t('header_adminPanel')}
                  </Button>
                )}
                <span className="text-sm text-primary-dark/80 hidden md:inline" title={currentUser.email || ''}>
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

      <footer className="bg-primary-dark text-white py-4 text-center mt-auto">
        <div className="container mx-auto px-4">
          <p className="text-sm opacity-80">&copy; {new Date().getFullYear()} {t('footerText')} {t('footerDisclaimer')}</p>
           <button 
              onClick={() => setCurrentPage(Page.Support)}
              className="text-sm text-accent hover:underline mt-2 inline-block"
            >
              {t('footer_supportLink')}
            </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
