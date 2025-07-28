import React from 'react';
import { Page } from '../types';
import { Button } from '../components/common/Button';
import { PageContainer } from '../components/common/PageContainer';
import { useLanguage } from '../contexts/LanguageContext';
import { CameraCaptureIcon, AnalyzeIcon, ReportIcon, ConnectIcon, AIIcon, CloudIcon, PrivacyIcon } from '../constants';

interface OurTechnologyPageProps {
  setCurrentPage: (page: Page) => void;
}

export const OurTechnologyPage: React.FC<OurTechnologyPageProps> = ({ setCurrentPage }) => {
  const { t } = useLanguage();

  const handleContactClick = () => {
    setCurrentPage(Page.Support);
  };
  
  const StepCard: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => (
    <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-dark-card rounded-xl shadow-lg hover:shadow-xl dark:hover:shadow-dark-accent/20 transition-shadow duration-300 h-full">
      <div className="text-accent dark:text-dark-accent mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-primary-dark dark:text-dark-text-primary mb-2">{title}</h3>
      <p className="text-sm text-primary-dark/80 dark:text-dark-text-secondary">{description}</p>
    </div>
  );

  const TechCard: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => (
    <div className="flex items-start space-x-6 p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
      <div className="flex-shrink-0 text-accent dark:text-dark-accent mt-1">{icon}</div>
      <div>
        <h3 className="text-xl font-semibold text-primary-dark dark:text-dark-text-primary mb-2">{title}</h3>
        <p className="text-base text-primary-dark/80 dark:text-dark-text-secondary">{description}</p>
      </div>
    </div>
  );
  
  return (
    <PageContainer>
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24 bg-primary-dark/5 dark:bg-dark-background/30 rounded-3xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-primary-dark dark:text-dark-text-primary">
          {t('our_tech_title')}
        </h1>
        <p className="mt-4 text-lg sm:text-xl max-w-3xl mx-auto text-primary-dark/80 dark:text-dark-text-secondary">
          {t('our_tech_subtitle')}
        </p>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-primary-dark dark:text-dark-text-primary">
          {t('our_tech_how_it_works_title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <StepCard icon={<CameraCaptureIcon />} title={t('our_tech_step1_title')} description={t('our_tech_step1_desc')} />
          <StepCard icon={<AnalyzeIcon />} title={t('our_tech_step2_title')} description={t('our_tech_step2_desc')} />
          <StepCard icon={<ReportIcon />} title={t('our_tech_step3_title')} description={t('our_tech_step3_desc')} />
          <StepCard icon={<ConnectIcon />} title={t('our_tech_step4_title')} description={t('our_tech_step4_desc')} />
        </div>
      </section>

      {/* Key Technologies Section */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-dark-card/50 rounded-3xl">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-primary-dark dark:text-dark-text-primary">
            {t('our_tech_key_technologies_title')}
          </h2>
          <div className="space-y-8">
            <TechCard icon={<AIIcon />} title={t('our_tech_tech1_title')} description={t('our_tech_tech1_desc')} />
            <TechCard icon={<CloudIcon />} title={t('our_tech_tech2_title')} description={t('our_tech_tech2_desc')} />
            <TechCard icon={<PrivacyIcon />} title={t('our_tech_tech3_title')} description={t('our_tech_tech3_desc')} />
          </div>
        </div>
      </section>

      {/* Integration Possibilities Section */}
      <section className="py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-dark dark:text-dark-text-primary">
            {t('our_tech_integration_title')}
          </h2>
          <p className="mt-4 text-lg text-primary-dark/80 dark:text-dark-text-secondary">
            {t('our_tech_integration_subtitle')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left">
            <div className="p-6 border border-gray-200 dark:border-dark-border rounded-lg">
                <h4 className="font-bold text-lg text-primary-dark dark:text-dark-text-primary">{t('our_tech_integration1_title')}</h4>
                <p className="text-sm mt-2 text-primary-dark/80 dark:text-dark-text-secondary">{t('our_tech_integration1_desc')}</p>
            </div>
            <div className="p-6 border border-gray-200 dark:border-dark-border rounded-lg">
                <h4 className="font-bold text-lg text-primary-dark dark:text-dark-text-primary">{t('our_tech_integration2_title')}</h4>
                <p className="text-sm mt-2 text-primary-dark/80 dark:text-dark-text-secondary">{t('our_tech_integration2_desc')}</p>
            </div>
            <div className="p-6 border border-gray-200 dark:border-dark-border rounded-lg">
                <h4 className="font-bold text-lg text-primary-dark dark:text-dark-text-primary">{t('our_tech_integration3_title')}</h4>
                <p className="text-sm mt-2 text-primary-dark/80 dark:text-dark-text-secondary">{t('our_tech_integration3_desc')}</p>
            </div>
          </div>
          <Button onClick={handleContactClick} size="lg" className="mt-12">
            {t('our_tech_contact_us_button')}
          </Button>
        </div>
      </section>
    </PageContainer>
  );
};