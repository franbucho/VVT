import React, { useState } from 'react';
import { Page } from '../types';
import { Button } from '../components/common/Button';
import { InputField } from '../components/common/InputField';
import { PageContainer } from '../components/common/PageContainer';
import { EyeIcon, ShowPasswordIcon, HidePasswordIcon } from '../constants';
import { signInWithEmail, signUpWithEmailPassword, signInWithGoogle, sendPasswordReset } from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext';
import { FirebaseError } from 'firebase/app';

interface AuthPageProps {
  setCurrentPage: (page: Page) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ setCurrentPage }) => {
  const { t } = useLanguage();
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuthError = (err: any) => {
    if (err instanceof FirebaseError) {
        switch (err.code) {
        case 'auth/email-already-in-use':
            setError(t('auth_error_email_in_use'));
            break;
        case 'auth/weak-password':
            setError(t('auth_error_weak_password'));
            break;
        case 'auth/user-not-found':
            setError(t('auth_error_user_not_found'));
            break;
        case 'auth/wrong-password':
            setError(t('auth_error_wrong_password'));
            break;
        case 'auth/invalid-email':
            setError(t('auth_error_invalid_email'));
            break;
        default:
            setError(t('auth_error_unexpected'));
            break;
        }
    } else {
         setError(t('auth_error_unexpected'));
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmailPassword(email, password, firstName, lastName);
      } else {
        await signInWithEmail(email, password);
      }
      setCurrentPage(Page.Exam);
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
        setCurrentPage(Page.Exam);
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

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setInfoMessage('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setIsForgotPassword(false);
  };
  
  const renderResetPasswordForm = () => (
    <div className="bg-card-bg p-8 rounded-xl shadow-2xl">
      <div className="flex justify-center mb-6">
        <EyeIcon className="w-12 h-12 text-accent"/>
      </div>
      <h2 className="text-center text-2xl font-bold text-primary mb-4">{t('auth_reset_password_title')}</h2>
      <p className="text-center text-sm text-primary/80 mb-6">{t('auth_reset_password_instructions')}</p>
      
      <form onSubmit={handlePasswordReset}>
        <InputField
          label={t('auth_emailLabel')}
          id="email-reset"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder={t('auth_emailPlaceholder')}
        />
        {error && <p className="text-danger text-sm mb-4 text-center">{error}</p>}
        {infoMessage && <p className="text-green-600 text-sm mb-4 text-center">{infoMessage}</p>}
        <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} size="lg">
          {isLoading ? t('auth_sending_link_button') : t('auth_send_link_button')}
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <button
          onClick={() => {
            setIsForgotPassword(false);
            setError('');
            setInfoMessage('');
          }}
          className="text-sm font-medium text-accent hover:text-accent-dark"
        >
          {t('auth_back_to_signin_link')}
        </button>
      </div>
    </div>
  );

  const renderAuthForm = () => (
    <div className="bg-card-bg p-8 rounded-xl shadow-2xl">
      <div className="flex justify-center mb-6">
        <EyeIcon className="w-12 h-12 text-accent"/>
      </div>
      
      <form onSubmit={handleEmailSubmit}>
        {isSignUp && (
          <div className="flex flex-col sm:flex-row sm:space-x-4">
            <InputField
              label={t('auth_firstNameLabel')}
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder={t('auth_firstNamePlaceholder')}
              className="w-full"
            />
            <InputField
              label={t('auth_lastNameLabel')}
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder={t('auth_lastNamePlaceholder')}
              className="w-full"
            />
          </div>
        )}
        <InputField
          label={t('auth_emailLabel')}
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder={t('auth_emailPlaceholder')}
        />
        <InputField
          label={t('auth_passwordLabel')}
          id="password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          endIcon={showPassword ? <HidePasswordIcon /> : <ShowPasswordIcon />}
          onEndIconClick={() => setShowPassword(!showPassword)}
        />
        {!isSignUp && (
            <div className="text-right -mt-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setError('');
                  setInfoMessage('');
                }}
                className="text-sm font-medium text-accent hover:text-accent-dark focus:outline-none"
              >
                {t('auth_forgot_password_link')}
              </button>
            </div>
          )}
        {error && <p className="text-danger text-sm mb-4 text-center">{error}</p>}
        <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} size="lg">
          {isLoading 
            ? (isSignUp ? t('auth_registeringButton') : t('auth_loggingInButton')) 
            : (isSignUp ? t('auth_signUpButton') : t('auth_signInButton'))}
        </Button>
      </form>

      <div className="my-6 flex items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-sm text-primary/60">{t('auth_orDivider')}</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      
      <Button onClick={handleGoogleSignIn} variant="outline" className="w-full border-gray-300 text-primary hover:bg-gray-50 hover:border-accent" isLoading={false} size="lg">
          <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M24 9.5c3.21 0 5.51.93 7.33 2.69l5.7-5.7C33.3 2.93 29.07 1 24 1 14.7 1 7.1 6.84 4.38 14.9l6.38 4.94C12.48 13.56 17.7 9.5 24 9.5z"></path>
            <path fill="#34A853" d="M46.22 25.12c0-1.66-.15-3.27-.42-4.83H24v9.09h12.48c-.54 2.9-2.08 5.37-4.38 7.02l6.38 4.94c3.7-3.41 5.74-8.42 5.74-14.22z"></path>
            <path fill="#FBBC05" d="M10.76 29.84c-.6-1.79-.94-3.72-.94-5.74s.34-3.95.94-5.74L4.38 14.9C1.56 20.33 1.56 27.67 4.38 33.1l6.38-3.26z"></path>
            <path fill="#EA4335" d="M24 47c5.07 0 9.3-1.66 12.33-4.52l-6.38-4.94c-1.68 1.13-3.81 1.8-6.05 1.8-6.3 0-11.52-4.06-13.24-9.56L4.38 33.1C7.1 41.16 14.7 47 24 47z"></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
          {t('auth_googleSignInButton')}
      </Button>

      <p className="mt-6 text-center text-sm text-primary/80">
        {isSignUp ? t('auth_alreadyHaveAccount') : t('auth_dontHaveAccount')}
        <button
          onClick={toggleForm}
          className="font-medium text-accent hover:text-accent-dark ml-1"
        >
          {isSignUp ? t('auth_signInHereLink') : t('auth_signUpHereLink')}
        </button>
      </p>
    </div>
  );

  return (
    <PageContainer title={isForgotPassword ? '' : (isSignUp ? t('auth_createAccount') : t('auth_loginToAccount'))} className="max-w-md mx-auto">
       {isForgotPassword ? renderResetPasswordForm() : renderAuthForm()}
    </PageContainer>
  );
};
