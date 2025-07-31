import React from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { useCountdown } from '../hooks/useCountdown';
import { useLanguage } from '../contexts/LanguageContext';
import { AppStoreDownloadBadge, GooglePlayDownloadBadge } from '../constants';

const CountdownSegment: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center bg-white dark:bg-dark-card p-4 sm:p-6 rounded-xl shadow-lg w-24 sm:w-32 text-center">
    <div className="text-4xl sm:text-6xl font-orbitron font-bold bg-gradient-to-r from-primary-dark to-accent bg-clip-text text-transparent dark:from-dark-text-primary dark:to-dark-accent">
      {String(value).padStart(2, '0')}
    </div>
    <div className="text-xs uppercase tracking-widest text-primary-dark/70 dark:text-dark-text-secondary/70 mt-2">
      {label}
    </div>
  </div>
);

export const MobileAppPage: React.FC = () => {
  const { t } = useLanguage();
  // Set the target launch date to Halloween 2025.
  const launchDate = '2025-10-31T00:00:00';
  const [days, hours, minutes, seconds] = useCountdown(launchDate);

  return (
    <PageContainer>
      <section className="text-center py-16 md:py-24 bg-primary-dark/5 dark:bg-dark-background/30 rounded-3xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-primary-dark to-accent bg-clip-text text-transparent dark:from-dark-text-primary dark:to-dark-accent">
          {t('mobile_title')}
        </h1>
        <p className="mt-4 text-lg sm:text-xl max-w-3xl mx-auto text-primary-dark/80 dark:text-dark-text-secondary">
          {t('mobile_subtitle')}
        </p>
      </section>

      <section className="py-16 md:py-24">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 text-primary-dark dark:text-dark-text-primary">
          {t('mobile_countdown_title')}
        </h2>
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8">
          <CountdownSegment value={days < 0 ? 0 : days} label={t('mobile_days')} />
          <CountdownSegment value={hours < 0 ? 0 : hours} label={t('mobile_hours')} />
          <CountdownSegment value={minutes < 0 ? 0 : minutes} label={t('mobile_minutes')} />
          <CountdownSegment value={seconds < 0 ? 0 : seconds} label={t('mobile_seconds')} />
        </div>
      </section>
      
      <section className="pb-16 md:pb-24">
         <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            {/* Apple App Store Card */}
            <div className="relative flex items-center justify-center p-8 border border-gray-200 dark:border-dark-border rounded-2xl shadow-lg bg-white dark:bg-dark-card w-full max-w-xs h-36 opacity-60">
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                    <span className="bg-gray-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full">{t('mobile_coming_soon')}</span>
                </div>
                <AppStoreDownloadBadge className="h-12 w-auto" />
            </div>
            {/* Google Play Store Card */}
            <div className="relative flex items-center justify-center p-8 border border-gray-200 dark:border-dark-border rounded-2xl shadow-lg bg-white dark:bg-dark-card w-full max-w-xs h-36 opacity-60">
                 <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                    <span className="bg-gray-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full">{t('mobile_coming_soon')}</span>
                </div>
                <GooglePlayDownloadBadge className="h-12 w-auto" />
            </div>
        </div>
      </section>
    </PageContainer>
  );
};