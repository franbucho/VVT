import React from 'react';
import { Page } from '../types';
import { Button } from '../components/common/Button';
import { FeatureCard } from '../components/home/FeatureCard';
import { PageContainer } from '../components/common/PageContainer';
import { EyeIcon, getFeaturesList } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface HomePageProps {
  setCurrentPage: (page: Page) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setCurrentPage }) => {
  const { t } = useLanguage();
  const features = getFeaturesList(t);

  return (
    <PageContainer className="bg-neutral-light">
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24 bg-gradient-to-br from-accent/80 via-accent to-accent-dark rounded-xl shadow-2xl text-white">
        <div className="container mx-auto px-6">
          <div className="mx-auto w-20 h-20 mb-6 flex items-center justify-center bg-white/25 rounded-full shadow-lg">
            <EyeIcon className="w-12 h-12 text-white"/>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            {t('appMotto')}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-10 max-w-3xl mx-auto opacity-90">
            {t('appSubMotto')}
          </p>
          <div className="mt-8">
            <Button 
                onClick={() => setCurrentPage(Page.Auth)} 
                size="lg"
                variant="primary"
            >
                {t('home_ctaButton')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-primary text-center mb-12 md:mb-16">
          {t('home_whyChooseOculusIA')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-16 md:py-24 bg-card-bg rounded-xl shadow-lg">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-8">{t('home_ourMission')}</h2>
          <p className="text-lg text-primary/90 max-w-3xl mx-auto leading-relaxed">
            {t('missionStatement')}
          </p>
        </div>
      </section>
    </PageContainer>
  );
};
