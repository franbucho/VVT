import React from 'react';
import { Page } from '../types';
import { Button } from '../components/common/Button';
import { FeatureCard } from '../components/home/FeatureCard';
import { PageContainer } from '../components/common/PageContainer';
import { getFeaturesList } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface HomePageProps {
  setCurrentPage: (page: Page) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setCurrentPage }) => {
  const { t } = useLanguage();
  const features = getFeaturesList(t);

  return (
    <PageContainer>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-transparent rounded-xl shadow-xl my-8">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            src="https://storage.googleapis.com/felipec-_bucket/hero-eye-animation-loop.mp4"
          />
          {/* Gradient overlay for futuristic glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a]/80 via-[#1e293b]/70 to-[#0f172a]/90"></div>
          {/* Optional glass effect */}
          <div className="absolute inset-0 backdrop-blur-[2px]"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-24 md:py-32 text-white">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
            {t('appMotto')}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-10 max-w-2xl text-white/80">
            {t('appSubMotto')}
          </p>
          <Button
            onClick={() => setCurrentPage(Page.Auth)}
            size="lg"
            variant="primary"
            className="shadow-xl hover:shadow-2xl transition-transform transform hover:scale-105"
          >
            {t('home_ctaButton')}
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-primary dark:text-dark-text-primary text-center mb-12 md:mb-16">
          {t('home_whyChooseNiria')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-16 md:py-24 bg-gray-50 dark:bg-dark-card/50 rounded-xl">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary dark:text-dark-text-primary mb-8">{t('home_ourMission')}</h2>
          <p className="text-lg text-primary/90 dark:text-dark-text-secondary max-w-3xl mx-auto leading-relaxed">
            {t('missionStatement')}
          </p>
        </div>
      </section>
    </PageContainer>
  );
};