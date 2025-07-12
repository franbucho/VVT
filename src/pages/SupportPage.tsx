
import React from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { Page } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SupportPageProps {
  setCurrentPage: (page: Page) => void;
}

export const SupportPage: React.FC<SupportPageProps> = ({ setCurrentPage }) => {
  const { t } = useLanguage();
  const supportEmail = "soporte@virtualvisiontest.com";

  return (
    <PageContainer title={t('support_title')}>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-primary-dark mb-4">{t('support_heading')}</h2>
        <p className="text-neutral-dark mb-6">{t('support_intro')}</p>
        <div className="bg-gray-50 p-6 rounded-lg text-left">
          <p className="text-neutral-dark mb-4">{t('support_instruction')}</p>
          <a href={`mailto:${supportEmail}`} className="text-lg font-bold text-accent hover:underline break-all">
            {supportEmail}
          </a>
          <p className="text-sm text-gray-500 mt-4">{t('support_include_info')}</p>
          <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
            <li>{t('support_info_email')}</li>
            <li>{t('support_info_date')}</li>
            <li>{t('support_info_problem')}</li>
          </ul>
        </div>
        <Button onClick={() => setCurrentPage(Page.Home)} className="mt-8">
          {t('support_back_home_button')}
        </Button>
      </div>
    </PageContainer>
  );
};
