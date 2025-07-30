import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../common/Button';
import { ShieldCheckIcon } from '../../constants';

interface InformedConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

export const InformedConsent: React.FC<InformedConsentProps> = ({ onAccept, onDecline }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-dark-card p-6 sm:p-8 rounded-xl shadow-2xl space-y-6">
      <div className="text-center">
        <ShieldCheckIcon className="w-12 h-12 text-accent dark:text-dark-accent mx-auto mb-4" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-dark to-accent bg-clip-text text-transparent dark:from-dark-text-primary dark:to-dark-accent">{t('consent_title')}</h2>
        <p className="mt-2 text-sm text-primary-dark/80 dark:text-dark-text-secondary">{t('consent_intro')}</p>
      </div>

      <div className="space-y-4 text-sm text-primary-dark dark:text-dark-text-secondary max-h-60 overflow-y-auto pr-4 border rounded-lg p-4 bg-gray-50/50 dark:bg-dark-background/50">
        <div>
          <h3 className="font-semibold text-primary-dark dark:text-dark-text-primary">{t('consent_purpose_title')}</h3>
          <p>{t('consent_purpose_text')}</p>
        </div>
        <div>
          <h3 className="font-semibold text-primary-dark dark:text-dark-text-primary">{t('consent_confidentiality_title')}</h3>
          <p>{t('consent_confidentiality_text')}</p>
        </div>
        <div>
          <h3 className="font-semibold text-primary-dark dark:text-dark-text-primary">{t('consent_not_a_diagnosis_title')}</h3>
          <p>{t('consent_not_a_diagnosis_text')}</p>
        </div>
      </div>
      
      <div className="bg-accent/10 dark:bg-dark-accent/10 p-4 rounded-lg">
        <p className="text-xs text-primary-dark dark:text-dark-text-primary font-medium">{t('consent_acceptance_text')}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 border-t border-gray-200 dark:border-dark-border">
        <Button onClick={onDecline} variant="outline" className="w-full sm:w-auto">
          {t('consent_decline_button')}
        </Button>
        <Button onClick={onAccept} variant="primary" size="lg" className="w-full sm:w-auto">
          {t('consent_accept_button')}
        </Button>
      </div>
    </div>
  );
};