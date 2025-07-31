import React from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { Page } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useSpotlight } from '../hooks/useSpotlight';

interface SupportPageProps {
  setCurrentPage: (page: Page) => void;
}

export const SupportPage: React.FC<SupportPageProps> = ({ setCurrentPage }) => {
  const { t } = useLanguage();
  const supportEmail = "soporte@niria.com";
  const { spotlightProps, Spotlight } = useSpotlight();

  return (
    <PageContainer title={t('support_title')}>
      <div {...spotlightProps} className="relative overflow-hidden max-w-2xl mx-auto bg-white dark:bg-dark-card p-8 rounded-xl shadow-2xl text-center">
        <Spotlight />
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary-dark to-accent bg-clip-text text-transparent dark:from-dark-text-primary dark:to-dark-accent">{t('support_heading')}</h2>
        <p className="text-primary-dark/80 dark:text-dark-text-secondary mb-6">
          {t('support_intro')}
        </p>
        <div className="bg-primary-dark/5 dark:bg-dark-background p-6 rounded-lg text-left">
          <p className="text-primary-dark dark:text-dark-text-primary mb-4">
            {t('support_instruction_email')}
          </p>
          <a href={`mailto:${supportEmail}`} className="text-lg font-bold text-accent hover:text-accent-hover dark:text-dark-accent dark:hover:text-dark-accent-hover break-all">
            {supportEmail}
          </a>
          <p className="text-sm text-primary-dark/70 dark:text-dark-text-secondary mt-4">
            {t('support_instruction_include')}
          </p>
          <ul className="list-disc list-inside text-sm text-primary-dark/80 dark:text-dark-text-secondary mt-2 space-y-1">
            <li>{t('support_info_1')}</li>
            <li>{t('support_info_2')}</li>
            <li>{t('support_info_3')}</li>
          </ul>
        </div>
        <Button onClick={() => setCurrentPage(Page.Home)} className="mt-8" variant="primary">
          {t('support_backToHomeButton')}
        </Button>
      </div>
    </PageContainer>
  );
};
