import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { auth, db } from './firebase';

import { Page, EyeAnalysisResult, HealthData, Ophthalmologist, EvaluationHistoryItem, UserProfile } from './types';
import { EyeIcon } from './constants';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { ExamPage } from './pages/ExamPage';
import { ResultsPage } from './pages/ResultsPage';
import { PaymentPage } from './pages/PaymentPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { SupportPage } from './pages/SupportPage';
import { DoctorPortal } from './pages/DoctorPortal';
import { EvaluationDetailPage } from './pages/EvaluationDetailPage';
import { HRAdminPage } from './pages/HRAdminPage';
import { PricingPage } from './pages/PricingPage';
import { useLanguage } from './contexts/LanguageContext';
import { LanguageSwitcher } from './components/common/LanguageSwitcher';
import { Button } from './components/common/Button';
import { getEvaluationsCount, getUserProfile } from './services/firestoreService';
import { ThemeSwitcher } from './components/common/ThemeSwitcher';
import { useReminderNotifications } from './hooks/useReminderNotifications';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [currentUser, setCurrentUser] = useState<firebase.User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Exam flow state
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<EyeAnalysisResult[] | null>(null);
  const [ophthalmologistSummary, setOphthalmologistSummary] = useState<string>('');
  const [ophthalmologists, setOphthalmologists] = useState<Ophthalmologist[] | null>(null);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [newEvaluationId, setNewEvaluationId] = useState<string | null>(null);
  
  // Role and usage state
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const [isHrAdmin, setIsHrAdmin] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [evaluationsCount, setEvaluationsCount] = useState(0);

  // Doctor portal state
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationHistoryItem | null>(null);
  
  const { t } = useLanguage();
  
  // Activate reminder notifications for the logged-in user
  useReminderNotifications(currentUser);


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          // Force refresh the token to get the latest custom claims
          const idTokenResult = await user.getIdTokenResult(true); 
          const claims = idTokenResult.claims;
          setIsAdmin(!!claims.admin);
          setIsPremium(!!claims.premium);
          setIsDoctor(!!claims.doctor);
          setIsHrAdmin(!!claims.hr_admin);

          const profileData = await getUserProfile(user.uid);
          if (profileData) {
             setUserProfile({ ...user, ...profileData });
             setTeamId(profileData.teamId || null);
          } else {
             setUserProfile({ ...user, medicalHistory: {} });
             setTeamId(null);
          }
          
          const count = await getEvaluationsCount(user.uid);
          setEvaluationsCount(count);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setIsAdmin(false);
          setIsPremium(false);
          setIsDoctor(false);
          setIsHrAdmin(false);
          setTeamId(null);
          setUserProfile(user); // fallback
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setIsAdmin(false);
        setIsPremium(false);
        setIsDoctor(false);
        setIsHrAdmin(false);
        setTeamId(null);
        setEvaluationsCount(0);
      }
      setIsAuthLoading(false);
    });

    // Handle redirects from Stripe after payment
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('payment_success') === 'true') {
        setIsPaymentComplete(true);
        setCurrentPage(Page.Results); // Go to results to see the new report
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (queryParams.get('payment_cancelled') === 'true' || queryParams.has('payment_cancel')) {
        setCurrentPage(Page.Exam); // Let user retry from exam page
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      // Reset all states on logout
      setHealthData(null);
      setCapturedImage(null);
      setAnalysisResults(null);
      setOphthalmologistSummary('');
      setOphthalmologists(null);
      setNewEvaluationId(null);
      setIsPaymentComplete(false);
      setIsAdmin(false);
      setIsPremium(false);
      setIsDoctor(false);
      setIsHrAdmin(false);
      setTeamId(null);
      setSelectedEvaluation(null);
      setEvaluationsCount(0);
      setCurrentPage(Page.Home);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSetCurrentPage = (page: Page, data?: any) => {
    if (page === Page.EvaluationDetail && data?.evaluation) {
        setSelectedEvaluation(data.evaluation);
    } else {
        setSelectedEvaluation(null);
    }
    setCurrentPage(page);
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
            setOphthalmologists={setOphthalmologists}
            setNewEvaluationId={setNewEvaluationId}
            setIsPaymentComplete={setIsPaymentComplete}
            currentUser={currentUser}
            isAdmin={isAdmin}
            isPremium={isPremium}
            evaluationsCount={evaluationsCount}
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
            ophthalmologists={ophthalmologists}
            currentUser={currentUser}
            healthData={healthData}
            capturedImage={capturedImage}
            isPaymentComplete={isPaymentComplete}
            newEvaluationId={newEvaluationId}
          />
        );
       case Page.Profile:
        if (!currentUser || !userProfile) {
          setCurrentPage(Page.Auth);
          return null;
        }
        return <ProfilePage userProfile={userProfile} setUserProfile={setUserProfile} />;
      case Page.Payment:
        if (!currentUser) {
          setCurrentPage(Page.Auth);
          return null;
        }
        return <PaymentPage setCurrentPage={setCurrentPage} />;
      case Page.Pricing:
        return <PricingPage setCurrentPage={setCurrentPage} currentUser={currentUser} />;
      case Page.Admin:
        if (!currentUser || !isAdmin) {
          setCurrentPage(Page.Home);
          return null;
        }
        return <AdminPage currentUser={currentUser} />;
      case Page.Support:
        return <SupportPage setCurrentPage={setCurrentPage} />;
      case Page.DoctorPortal:
        if (!currentUser || !isDoctor) {
            setCurrentPage(Page.Home);
            return null;
        }
        return <DoctorPortal setCurrentPage={handleSetCurrentPage} />;
      case Page.EvaluationDetail:
          if (!currentUser || !isDoctor || !selectedEvaluation) {
              handleSetCurrentPage(Page.DoctorPortal);
              return null;
          }
          return <EvaluationDetailPage evaluation={selectedEvaluation} setCurrentPage={handleSetCurrentPage} />;
      case Page.HR_ADMIN:
          if (!currentUser || !isHrAdmin) {
              setCurrentPage(Page.Home);
              return null;
          }
          return <HRAdminPage isAdmin={isAdmin} teamId={teamId} />;
      default:
        return <HomePage setCurrentPage={setCurrentPage} />;
    }
  };

  const isExamFlow = currentPage === Page.Exam;

  return (
    <div className={`min-h-screen flex flex-col ${isExamFlow ? 'bg-white dark:bg-dark-card' : 'bg-neutral-light dark:bg-dark-background'}`}>
      {!isExamFlow && (
        <header className="bg-white dark:bg-dark-card shadow-md sticky top-0 z-50">
          <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap justify-between items-center gap-y-2">
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => setCurrentPage(Page.Home)}
              aria-label={t('appName')}
            >
              <EyeIcon className="w-8 h-8 text-accent dark:text-dark-accent" />
              <span className="text-xl font-bold text-primary-dark dark:text-dark-text-primary">{t('appName')}</span>
            </div>
            <div className="flex items-center flex-wrap justify-end gap-x-2 sm:gap-x-4 gap-y-2">
              <LanguageSwitcher />
              <ThemeSwitcher />
              {isAuthLoading ? (
                <div className="w-32 h-9 bg-gray-200 dark:bg-dark-border/50 rounded-lg animate-pulse"></div>
              ) : currentUser ? (
                <div className="flex items-center flex-wrap justify-end gap-x-2 sm:gap-x-4 gap-y-2">
                  <button 
                    onClick={() => setCurrentPage(Page.Profile)}
                    className="text-sm font-medium text-primary-dark hover:text-accent dark:text-dark-text-primary dark:hover:text-dark-accent transition-colors"
                  >
                    {t('header_myProfileLink')}
                  </button>
                  {isAdmin && (
                    <Button 
                      onClick={() => setCurrentPage(Page.Admin)} 
                      variant="ghost" 
                      size="sm"
                    >
                      {t('header_adminPanel')}
                    </Button>
                  )}
                  {isDoctor && (
                    <Button 
                      onClick={() => setCurrentPage(Page.DoctorPortal)} 
                      variant="ghost" 
                      size="sm"
                    >
                      {t('header_doctorPortal')}
                    </Button>
                  )}
                  {isHrAdmin && (
                    <Button 
                      onClick={() => setCurrentPage(Page.HR_ADMIN)} 
                      variant="ghost" 
                      size="sm"
                    >
                      {t('header_hrAdminPanel')}
                    </Button>
                  )}
                  <span className="text-sm text-primary-dark/80 dark:text-dark-text-secondary hidden md:inline" title={currentUser.email || ''}>
                    {t('header_welcomeMessage', { email: currentUser.displayName?.split(' ')[0] || 'User' })}
                  </span>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                  >
                    {t('header_logoutButton')}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-x-2 sm:gap-x-4">
                  <Button
                      onClick={() => setCurrentPage(Page.Pricing)}
                      variant="ghost"
                      size="sm"
                  >
                      {t('header_pricingLink')}
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(Page.Auth)}
                    variant="primary"
                    size="sm"
                  >
                    {t('header_loginRegisterButton')}
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </header>
      )}

      <main className="flex-grow">
        {renderPage()}
      </main>

      {!isExamFlow && (
        <footer className="bg-primary-dark dark:bg-dark-card text-white dark:text-dark-text-primary py-4 text-center mt-auto">
          <div className="container mx-auto px-4">
            <p className="text-sm opacity-80">&copy; {new Date().getFullYear()} {t('footerText')} {t('footerDisclaimer')}</p>
            <button 
                onClick={() => setCurrentPage(Page.Support)}
                className="text-sm text-accent hover:underline mt-2 inline-block dark:text-dark-accent"
              >
                {t('footer_supportLink')}
              </button>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;