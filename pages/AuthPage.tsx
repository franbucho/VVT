import React, { useState } from 'react';
import { Page, DoctorProfile } from '../types';
import { Button } from '../components/common/Button';
import { InputField } from '../components/common/InputField';
import { PageContainer } from '../components/common/PageContainer';
import { EyeIcon, ShowPasswordIcon, HidePasswordIcon } from '../constants';
import { signInWithEmail, signUpWithEmailPassword, signInWithGoogle, sendPasswordReset, signUpDoctor } from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext';
import { useSpotlight } from '../hooks/useSpotlight';

type AuthView = 'login' | 'user-signup' | 'doctor-signup' | 'forgot-password';

interface AuthPageProps {
  setCurrentPage: (page: Page) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ setCurrentPage }) => {
  const { t } = useLanguage();
  const [authView, setAuthView] = useState<AuthView>('login');
  
  // Shared state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // User sign-up state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Doctor sign-up state
  const [doctorData, setDoctorData] = useState<DoctorProfile>({
      specialty: '',
      licenseNumber: '',
      graduationYear: '',
      country: '',
      state: '',
      city: '',
  });

  const { spotlightProps, Spotlight } = useSpotlight();

  const clearFormState = () => {
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setError('');
      setInfoMessage('');
      setDoctorData({ specialty: '', licenseNumber: '', graduationYear: '', country: '', state: '', city: '' });
  };

  const handleAuthError = (err: any) => {
    if (err && typeof err.code === 'string') {
        switch (err.code) {
        case 'auth/email-already-in-use': setError(t('auth_error_email_in_use')); break;
        case 'auth/weak-password': setError(t('auth_error_weak_password')); break;
        case 'auth/user-not-found': setError(authView === 'forgot-password' ? t('auth_error_user_not_found') : t('auth_error_invalid_credentials')); break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential': setError(t('auth_error_invalid_credentials')); break;
        case 'auth/invalid-email': setError(t('auth_error_invalid_email')); break;
        default: setError(t('auth_error_unexpected')); break;
        }
    } else {
         setError(t('auth_error_unexpected'));
    }
  };

  const handleUserSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setIsLoading(true);
    try {
        await signInWithEmail(email, password);
        setCurrentPage(Page.Home);
    } catch (err) {
        handleAuthError(err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleUserSignUp = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);
      try {
          await signUpWithEmailPassword(email, password, firstName, lastName);
          setCurrentPage(Page.Home);
      } catch (err) {
          handleAuthError(err);
      } finally {
          setIsLoading(false);
      }
  };
  
  const handleDoctorSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
        await signUpDoctor(email, password, firstName, lastName, doctorData);
        setAuthView('login');
        setInfoMessage(t('auth_doctor_signup_success'));
    } catch (err) {
        handleAuthError(err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setInfoMessage('');
    setIsLoading(true);
    try {
        await signInWithGoogle();
        setCurrentPage(Page.Home);
    } catch (err) {
        handleAuthError(err);
    } finally {
        setIsLoading(false);
    }
  }
  
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setInfoMessage(t('auth_reset_link_sent'));
    } catch (err) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const switchView = (view: AuthView) => {
      clearFormState();
      setAuthView(view);
  };

  const renderForgotPasswordForm = () => (
    <>
      <h2 className="text-center text-2xl font-bold mb-4 bg-gradient-to-r from-primary-dark to-accent bg-clip-text text-transparent dark:from-dark-text-primary dark:to-dark-accent">{t('auth_reset_password_title')}</h2>
      <p className="text-center text-sm text-primary/80 dark:text-dark-text-secondary mb-6">{t('auth_reset_password_instructions')}</p>
      
      <form onSubmit={handlePasswordReset}>
        <InputField label={t('auth_emailLabel')} id="email-reset" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={t('auth_emailPlaceholder')} />
        {error && <p className="text-danger text-sm mb-4 text-center">{error}</p>}
        {infoMessage && <p className="text-green-600 text-sm mb-4 text-center">{infoMessage}</p>}
        <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} size="lg">
          {isLoading ? t('auth_sending_link_button') : t('auth_send_link_button')}
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <button onClick={() => switchView('login')} className="text-sm font-medium text-accent hover:text-accent-dark dark:text-dark-accent dark:hover:text-dark-accent-hover">{t('auth_back_to_signin_link')}</button>
      </div>
    </>
  );

  const renderLoginForm = () => (
      <>
        <form onSubmit={handleUserSignIn}>
            <InputField label={t('auth_emailLabel')} id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={t('auth_emailPlaceholder')} />
            <InputField label={t('auth_passwordLabel')} id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" endIcon={showPassword ? <HidePasswordIcon /> : <ShowPasswordIcon />} onEndIconClick={() => setShowPassword(!showPassword)} />
            <div className="text-right -mt-2 mb-4">
                <button type="button" onClick={() => switchView('forgot-password')} className="text-sm font-medium text-accent hover:text-accent-dark dark:text-dark-accent dark:hover:text-dark-accent-hover focus:outline-none">{t('auth_forgot_password_link')}</button>
            </div>
            {error && <p className="text-danger text-sm mb-4 text-center">{error}</p>}
            {infoMessage && <p className="text-green-600 text-sm mb-4 text-center">{infoMessage}</p>}
            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} size="lg">{isLoading ? t('auth_loggingInButton') : t('auth_signInButton')}</Button>
        </form>
        <div className="my-6 flex items-center"><div className="flex-grow border-t border-gray-300 dark:border-dark-border"></div><span className="flex-shrink mx-4 text-sm text-primary/60 dark:text-dark-text-secondary">{t('auth_orDivider')}</span><div className="flex-grow border-t border-gray-300 dark:border-dark-border"></div></div>
        <Button onClick={handleGoogleSignIn} variant="outline" className="w-full" size="lg"><svg className="w-5 h-5 mr-3" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.21 0 5.51.93 7.33 2.69l5.7-5.7C33.3 2.93 29.07 1 24 1 14.7 1 7.1 6.84 4.38 14.9l6.38 4.94C12.48 13.56 17.7 9.5 24 9.5z"></path><path fill="#34A853" d="M46.22 25.12c0-1.66-.15-3.27-.42-4.83H24v9.09h12.48c-.54 2.9-2.08 5.37-4.38 7.02l6.38 4.94c3.7-3.41 5.74-8.42 5.74-14.22z"></path><path fill="#FBBC05" d="M10.76 29.84c-.6-1.79-.94-3.72-.94-5.74s.34-3.95.94-5.74L4.38 14.9C1.56 20.33 1.56 27.67 4.38 33.1l6.38-3.26z"></path><path fill="#EA4335" d="M24 47c5.07 0 9.3-1.66 12.33-4.52l-6.38-4.94c-1.68 1.13-3.81 1.8-6.05 1.8-6.3 0-11.52-4.06-13.24-9.56L4.38 33.1C7.1 41.16 14.7 47 24 47z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>{t('auth_googleSignInButton')}</Button>
        <p className="mt-6 text-center text-sm text-primary/80 dark:text-dark-text-secondary">{t('auth_dontHaveAccount')} <button onClick={() => switchView('user-signup')} className="font-medium text-accent hover:text-accent-dark dark:text-dark-accent dark:hover:text-dark-accent-hover ml-1">{t('auth_signUpHereLink')}</button></p>
      </>
  );

  const renderUserSignUpForm = () => (
      <>
          <form onSubmit={handleUserSignUp}>
              <div className="flex flex-col sm:flex-row sm:space-x-4">
                  <InputField label={t('auth_firstNameLabel')} id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder={t('auth_firstNamePlaceholder')} />
                  <InputField label={t('auth_lastNameLabel')} id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder={t('auth_lastNamePlaceholder')} />
              </div>
              <InputField label={t('auth_emailLabel')} id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={t('auth_emailPlaceholder')} />
              <InputField label={t('auth_passwordLabel')} id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" endIcon={showPassword ? <HidePasswordIcon /> : <ShowPasswordIcon />} onEndIconClick={() => setShowPassword(!showPassword)} />
              {error && <p className="text-danger text-sm mb-4 text-center">{error}</p>}
              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} size="lg">{isLoading ? t('auth_registeringButton') : t('auth_signUpButton')}</Button>
          </form>
          <div className="my-6 flex items-center"><div className="flex-grow border-t border-gray-300 dark:border-dark-border"></div><span className="flex-shrink mx-4 text-sm text-primary/60 dark:text-dark-text-secondary">{t('auth_orDivider')}</span><div className="flex-grow border-t border-gray-300 dark:border-dark-border"></div></div>
          <p className="mt-6 text-center text-sm text-primary/80 dark:text-dark-text-secondary">{t('auth_alreadyHaveAccount')} <button onClick={() => switchView('login')} className="font-medium text-accent hover:text-accent-dark dark:text-dark-accent dark:hover:text-dark-accent-hover ml-1">{t('auth_signInHereLink')}</button></p>
          <p className="mt-4 text-center text-sm text-primary/80 dark:text-dark-text-secondary">{t('auth_areYouADoctor')} <button onClick={() => switchView('doctor-signup')} className="font-medium text-accent hover:text-accent-dark dark:text-dark-accent dark:hover:text-dark-accent-hover ml-1">{t('auth_registerAsDoctorLink')}</button></p>
      </>
  );
  
  const renderDoctorSignUpForm = () => (
    <>
      <form onSubmit={handleDoctorSignUp}>
          <InputField label={t('auth_firstNameLabel')} id="docFirstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder={t('auth_firstNamePlaceholder')} />
          <InputField label={t('auth_lastNameLabel')} id="docLastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder={t('auth_lastNamePlaceholder')} />
          <InputField label={t('auth_emailLabel')} id="docEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={t('auth_emailPlaceholder')} />
          <InputField label={t('auth_passwordLabel')} id="docPassword" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" endIcon={showPassword ? <HidePasswordIcon /> : <ShowPasswordIcon />} onEndIconClick={() => setShowPassword(!showPassword)} />
          <InputField label={t('doctor_specialty_label')} id="docSpecialty" value={doctorData.specialty} onChange={(e) => setDoctorData({...doctorData, specialty: e.target.value})} required placeholder={t('doctor_specialty_placeholder')} />
          <InputField label={t('doctor_license_label')} id="docLicense" value={doctorData.licenseNumber} onChange={(e) => setDoctorData({...doctorData, licenseNumber: e.target.value})} required placeholder={t('doctor_license_placeholder')} />
          <InputField label={t('doctor_graduationYear_label')} id="docGradYear" type="number" value={doctorData.graduationYear} onChange={(e) => setDoctorData({...doctorData, graduationYear: e.target.value})} required placeholder={t('doctor_graduationYear_placeholder')} />
          <InputField label={t('doctor_country_label')} id="docCountry" value={doctorData.country} onChange={(e) => setDoctorData({...doctorData, country: e.target.value})} required placeholder={t('doctor_country_placeholder')} />
          <InputField label={t('doctor_state_label')} id="docState" value={doctorData.state} onChange={(e) => setDoctorData({...doctorData, state: e.target.value})} required placeholder={t('doctor_state_placeholder')} />
          <InputField label={t('doctor_city_label')} id="docCity" value={doctorData.city} onChange={(e) => setDoctorData({...doctorData, city: e.target.value})} required placeholder={t('doctor_city_placeholder')} />
          {error && <p className="text-danger text-sm mb-4 text-center">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} size="lg">{isLoading ? t('auth_registeringButton') : t('auth_signUpButton')}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-primary/80 dark:text-dark-text-secondary">{t('auth_not_a_doctor')} <button onClick={() => switchView('user-signup')} className="font-medium text-accent hover:text-accent-dark dark:text-dark-accent dark:hover:text-dark-accent-hover ml-1">{t('auth_register_as_user_link')}</button></p>
    </>
  );

  const getTitle = () => {
      switch(authView) {
          case 'login': return t('auth_loginToAccount');
          case 'user-signup': return t('auth_createAccount');
          case 'doctor-signup': return t('auth_doctorRegistrationTitle');
          case 'forgot-password': return '';
          default: return '';
      }
  };

  return (
    <PageContainer title={getTitle()} className="max-w-md mx-auto">
        <div {...spotlightProps} className="relative overflow-hidden bg-white dark:bg-dark-card p-8 rounded-xl shadow-2xl">
            <Spotlight />
            <div className="flex justify-center mb-6"><EyeIcon className="w-20 h-20"/></div>
            {authView === 'login' && renderLoginForm()}
            {authView === 'user-signup' && renderUserSignUpForm()}
            {authView === 'doctor-signup' && renderDoctorSignUpForm()}
            {authView === 'forgot-password' && renderForgotPasswordForm()}
        </div>
    </PageContainer>
  );
};