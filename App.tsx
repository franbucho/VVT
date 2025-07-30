import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { auth, db } from './firebase';

import { Page, EyeAnalysisResult, HealthData, Ophthalmologist, EvaluationHistoryItem, UserProfile } from './types';
import { EyeIcon, MenuIcon, XIcon } from './constants';
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
import { OurTechnologyPage } from './pages/OurTechnologyPage';
import { useLanguage } from './contexts/LanguageContext';
import { LanguageSwitcher } from './components/common/LanguageSwitcher';
import { Button } from './components/common/Button';
import { getEvaluationsCount, getUserProfile } from './services/firestoreService';
import { ThemeSwitcher } from './components/common/ThemeSwitcher';
import { useReminderNotifications } from './hooks/useReminderNotifications';
import { LoadingSpinner } from './components/common/LoadingSpinner';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [currentUser, setCurrentUser] = useState<firebase.User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    if (isMobileMenuOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
    return () => {
        document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);

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
      setIsMobileMenuOpen(false);
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
    setIsMobileMenuOpen(false);
  };

  const renderPage = () => {
    if (isAuthLoading) {
      return (
        <div className="flex justify-center items-center h-full pt-20">
            <EyeIcon className="w-16 h-16 animate-pulse" />
        </div>
      );
    }

    switch (currentPage) {
      case Page.Home:
        return <HomePage setCurrentPage={handleSetCurrentPage} evaluationsCount={evaluationsCount} currentUser={currentUser} />;
      
      case Page.Auth:
        if (currentUser) {
            handleSetCurrentPage(Page.Home);
            return null;
        }
        return <AuthPage setCurrentPage={handleSetCurrentPage} />;

      case Page.Exam:
        if (!currentUser) {
          handleSetCurrentPage(Page.Auth);
          return null;
        }
        return (
          <ExamPage
            setCurrentPage={handleSetCurrentPage}
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
          handleSetCurrentPage(Page.Auth);
          return null;
        }
        return (
          <ResultsPage
            setCurrentPage={handleSetCurrentPage}
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
          handleSetCurrentPage(Page.Auth);
          return null;
        }
        return <ProfilePage userProfile={userProfile} setUserProfile={setUserProfile} />;
      case Page.Payment:
        if (!currentUser) {
          handleSetCurrentPage(Page.Auth);
          return null;
        }
        return <PaymentPage setCurrentPage={handleSetCurrentPage} />;
      case Page.Pricing:
        return <PricingPage setCurrentPage={handleSetCurrentPage} currentUser={currentUser} />;
      case Page.OurTechnology:
        return <OurTechnologyPage setCurrentPage={handleSetCurrentPage} />;
      case Page.Admin:
        if (!currentUser || !isAdmin) {
          handleSetCurrentPage(Page.Home);
          return null;
        }
        return <AdminPage currentUser={currentUser} />;
      case Page.Support:
        return <SupportPage setCurrentPage={handleSetCurrentPage} />;
      case Page.DoctorPortal:
        if (!currentUser || !isDoctor) {
            handleSetCurrentPage(Page.Home);
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
              handleSetCurrentPage(Page.Home);
              return null;
          }
          return <HRAdminPage isAdmin={isAdmin} teamId={teamId} />;
      default:
        return <HomePage setCurrentPage={handleSetCurrentPage} evaluationsCount={evaluationsCount} currentUser={currentUser} />;
    }
  };

  const isExamFlow = currentPage === Page.Exam;

  return (
    <div className={`min-h-screen flex flex-col ${isExamFlow ? 'bg-white dark:bg-dark-card' : 'bg-neutral-light dark:bg-dark-background'}`}>
      {!isExamFlow && (
        <>
          <header className="bg-white dark:bg-dark-card shadow-md sticky top-0 z-50">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
              <div 
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => handleSetCurrentPage(Page.Home)}
                aria-label={t('appName')}
              >
                <EyeIcon className="w-8 h-8" />
                <span className="font-orbitron text-2xl font-bold tracking-wide text-primary-dark dark:text-dark-text-primary">{t('appName')}</span>
              </div>
              
              {/* Simplified Header Controls - Always visible */}
              <div className="flex items-center gap-x-1 sm:gap-x-2">
                <LanguageSwitcher />
                <ThemeSwitcher />
                <button 
                  onClick={() => setIsMobileMenuOpen(true)} 
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-border/50 focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-dark-accent" 
                  aria-label="Open menu"
                >
                  <MenuIcon className="w-6 h-6 text-primary-dark dark:text-dark-text-primary" />
                </button>
              </div>
            </nav>
          </header>

          {/* Menu Overlay - Now used for all screen sizes */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 bg-primary-dark/95 dark:bg-dark-background/95 z-[100] flex flex-col items-center justify-center p-8 animate-fadeIn">
              <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-5 right-5 p-2" aria-label="Close menu">
                  <XIcon className="w-8 h-8 text-white" />
              </button>
              
              <nav className="flex flex-col items-center text-center gap-y-6">
                {isAuthLoading ? (
                  <LoadingSpinner />
                ) : currentUser ? (
                  <>
                    <Button onClick={() => handleSetCurrentPage(Page.Profile)} variant="ghost" className="text-2xl text-white py-2">{t('header_myProfileLink')}</Button>
                    <Button onClick={() => handleSetCurrentPage(Page.OurTechnology)} variant="ghost" className="text-2xl text-white py-2">{t('header_ourTechnologyLink')}</Button>
                    <Button onClick={() => handleSetCurrentPage(Page.Pricing)} variant="ghost" className="text-2xl text-white py-2">{t('header_pricingLink')}</Button>
                    {isAdmin && <Button onClick={() => handleSetCurrentPage(Page.Admin)} variant="ghost" className="text-2xl text-white py-2">{t('header_adminPanel')}</Button>}
                    {isDoctor && <Button onClick={() => handleSetCurrentPage(Page.DoctorPortal)} variant="ghost" className="text-2xl text-white py-2">{t('header_doctorPortal')}</Button>}
                    {isHrAdmin && <Button onClick={() => handleSetCurrentPage(Page.HR_ADMIN)} variant="ghost" className="text-2xl text-white py-2">{t('header_hrAdminPanel')}</Button>}
                    <Button onClick={() => handleSetCurrentPage(Page.Support)} variant="ghost" className="text-2xl text-white py-2">{t('footer_supportLink')}</Button>
                    <Button onClick={handleSignOut} variant="outline" size="lg" className="text-xl text-white border-white mt-8 px-8 py-3">{t('header_logoutButton')}</Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => handleSetCurrentPage(Page.OurTechnology)} variant="ghost" className="text-2xl text-white py-2">{t('header_ourTechnologyLink')}</Button>
                    <Button onClick={() => handleSetCurrentPage(Page.Pricing)} variant="ghost" className="text-2xl text-white py-2">{t('header_pricingLink')}</Button>
                    <Button onClick={() => handleSetCurrentPage(Page.Support)} variant="ghost" className="text-2xl text-white py-2">{t('footer_supportLink')}</Button>
                    <Button onClick={() => handleSetCurrentPage(Page.Auth)} variant="primary" size="lg" className="text-xl mt-8 px-8 py-3">{t('header_loginRegisterButton')}</Button>
                  </>
                )}
              </nav>
            </div>
          )}
        </>
      )}

      <main className="flex-grow">
        {renderPage()}
      </main>

      {!isExamFlow && (
        <footer className="bg-primary-dark dark:bg-dark-card text-white dark:text-dark-text-primary py-4 text-center mt-auto">
          <div className="container mx-auto px-4">
            <p className="text-sm opacity-80">&copy; {new Date().getFullYear()} {t('footerText')} {t('footerDisclaimer')}</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;