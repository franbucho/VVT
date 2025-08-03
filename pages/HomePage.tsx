import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { Page } from '../types';
import { Button } from '../components/common/Button';
import { PageContainer } from '../components/common/PageContainer';
import { getFeaturesList } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { TestimonialsSection } from '../components/home/TestimonialsSection';
import { useSpotlight } from '../hooks/useSpotlight';

interface HomePageProps {
  setCurrentPage: (page: Page) => void;
  evaluationsCount: number;
  currentUser: firebase.User | null;
}

export const HomePage: React.FC<HomePageProps> = ({ setCurrentPage, evaluationsCount, currentUser }) => {
  const { t } = useLanguage();
  const features = getFeaturesList(t);

  const { spotlightProps: heroSpotlightProps, Spotlight: HeroSpotlight } = useSpotlight({ size: 600, color: 'rgba(59, 187, 217, 0.15)' });
  const { spotlightProps: featuresSpotlightProps, Spotlight: FeaturesSpotlight } = useSpotlight({ size: 600, color: 'rgba(59, 187, 217, 0.15)' });
  const { spotlightProps: dynamicInfoSpotlightProps, Spotlight: DynamicInfoSpotlight } = useSpotlight({ size: 600, color: 'rgba(59, 187, 217, 0.15)' });
  const { spotlightProps: mobilePromoSpotlightProps, Spotlight: MobilePromoSpotlight } = useSpotlight({ size: 600, color: 'rgba(59, 187, 217, 0.15)' });
  
  // States for the dynamic info carousel
  const rotatingTexts = [
    { title: t('home_mission_title'), text: t('home_mission_text') },
    { title: t('home_vision_title'), text: t('home_vision_text') },
    { title: t('home_fact_title'), text: t('home_fact1') },
    { title: t('home_fact_title'), text: t('home_fact2') },
    { title: t('home_fact_title'), text: t('home_fact3') },
    { title: t('home_fact_title'), text: t('home_fact4') },
  ];
  const [dynamicInfoIndex, setDynamicInfoIndex] = useState(0);
  const [isDynamicInfoFading, setIsDynamicInfoFading] = useState(false);
  
  // States for the features carousel
  const [featureIndex, setFeatureIndex] = useState(0);
  const [isFeatureFading, setIsFeatureFading] = useState(false);

  const handleStartAnalysis = () => {
    if (currentUser) {
      setCurrentPage(Page.Exam);
    } else {
      setCurrentPage(Page.Auth);
    }
  };

  // Autoplay for the dynamic info carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setIsDynamicInfoFading(true);
      setTimeout(() => {
        setDynamicInfoIndex(prev => (prev + 1) % rotatingTexts.length);
        setIsDynamicInfoFading(false);
      }, 500); // This duration must match the CSS transition duration for a smooth effect
    }, 7000); // Rotate every 7 seconds
    return () => clearInterval(timer);
  }, [rotatingTexts.length]);

  // Autoplay for the features carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setIsFeatureFading(true);
      setTimeout(() => {
        setFeatureIndex(prev => (prev + 1) % features.length);
        setIsFeatureFading(false);
      }, 500);
    }, 7000);
    return () => clearInterval(timer);
  }, [features.length]);

  const goToDynamicInfoSlide = (index: number) => {
    if (index === dynamicInfoIndex) return;
    setIsDynamicInfoFading(true);
    setTimeout(() => {
      setDynamicInfoIndex(index);
      setIsDynamicInfoFading(false);
    }, 500);
  };
  
  const goToFeatureSlide = (index: number) => {
    if (index === featureIndex) return;
    setIsFeatureFading(true);
    setTimeout(() => {
      setFeatureIndex(index);
      setIsFeatureFading(false);
    }, 500);
  };
  
  const currentDynamicInfo = rotatingTexts[dynamicInfoIndex];
  const currentFeature = features[featureIndex];

  return (
    <PageContainer>
      {/* Hero Section */}
      <section 
        className="relative overflow-hidden bg-transparent rounded-3xl shadow-2xl my-12"
        {...heroSpotlightProps}
      >
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            src="https://storage.googleapis.com/felipec-_bucket/hero-eye-animation-loop.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a]/80 via-[#1e293b]/70 to-[#0f172a]/90" />
          <div className="absolute inset-0 backdrop-blur-[2px]" />
          {/* Spotlight Effect Div */}
          <HeroSpotlight />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 py-24 sm:py-32 lg:py-40 text-white flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight max-w-4xl drop-shadow-xl">
            {t('appMotto')}
          </h1>
          <p className="mt-6 text-lg sm:text-xl lg:text-2xl max-w-2xl text-white/90">
            {t('appSubMotto')}
          </p>
          <Button
            onClick={handleStartAnalysis}
            size="lg"
            variant="primary"
            className="mt-10 px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-2xl transform transition-transform hover:scale-105"
          >
            {evaluationsCount === 0 ? t('home_ctaButton_free') : t('home_ctaButton')}
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24">
        <div 
          className="relative overflow-hidden max-w-5xl mx-auto text-center p-8 sm:p-12 bg-white dark:bg-dark-card rounded-2xl shadow-xl"
          {...featuresSpotlightProps}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 md:mb-16 bg-gradient-to-r from-primary-dark to-accent bg-clip-text text-transparent dark:from-dark-text-primary dark:to-dark-accent">
            {t('home_whyChooseNiria')}
          </h2>
          
          <div className="relative min-h-[18rem] flex flex-col items-center justify-center overflow-hidden">
            <div className={`transition-opacity duration-500 ease-in-out w-full max-w-lg mx-auto ${isFeatureFading ? 'opacity-0' : 'opacity-100'}`}>
              <div className="flex flex-col items-center h-full">
                <div className="mb-4 text-accent dark:text-dark-accent">
                  {currentFeature.icon}
                </div>
                <h3 className="mb-2 text-2xl font-bold text-primary-dark dark:text-dark-text-primary text-center">{currentFeature.titleKey}</h3>
                <p className="text-lg text-primary-dark/90 dark:text-dark-text-secondary text-center leading-relaxed">{currentFeature.descriptionKey}</p>
              </div>
            </div>
          </div>
          
          {/* Navigation Dots */}
          <div className="flex justify-center mt-8 space-x-3">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => goToFeatureSlide(index)}
                aria-label={`Go to feature ${index + 1}`}
                className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent dark:focus:ring-dark-accent ${
                  featureIndex === index
                    ? 'bg-accent dark:bg-dark-accent scale-125'
                    : 'bg-gray-300 dark:bg-dark-border/50 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
          <FeaturesSpotlight />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
          <TestimonialsSection />
      </section>

      {/* Dynamic Info Section */}
      <section id="mission" className="py-16">
        <div 
          className="relative overflow-hidden max-w-5xl mx-auto text-center p-8 sm:p-12 bg-white dark:bg-dark-card rounded-2xl shadow-xl"
          {...dynamicInfoSpotlightProps}
        >
           <div className="relative min-h-[20rem] flex flex-col items-center justify-center overflow-hidden">
            <div className={`transition-opacity duration-500 ease-in-out ${isDynamicInfoFading ? 'opacity-0' : 'opacity-100'}`}>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-primary-dark dark:text-dark-text-primary">{currentDynamicInfo.title}</h2>
                <p className="text-lg text-primary-dark/90 dark:text-dark-text-secondary max-w-3xl mx-auto leading-relaxed">
                  {currentDynamicInfo.text}
                </p>
            </div>
          </div>
          {/* Navigation Dots */}
          <div className="flex justify-center mt-12 space-x-3">
            {rotatingTexts.map((_, index) => (
              <button
                key={index}
                onClick={() => goToDynamicInfoSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent dark:focus:ring-dark-accent ${
                  dynamicInfoIndex === index
                    ? 'bg-accent dark:bg-dark-accent scale-125'
                    : 'bg-gray-300 dark:bg-dark-border/50 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
          {/* Spotlight Effect Div */}
          <DynamicInfoSpotlight />
        </div>
      </section>

      {/* Mobile App Promo Section */}
      <section id="mobile-promo" className="py-16">
        <div 
          className="relative overflow-hidden max-w-5xl mx-auto text-center p-8 sm:p-12 bg-white dark:bg-dark-card rounded-2xl shadow-xl"
          {...mobilePromoSpotlightProps}
        >
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-dark to-accent bg-clip-text text-transparent dark:from-dark-text-primary dark:to-dark-accent">
            {t('home_promo_mobile_title')}
          </h2>
          <p className="mt-4 text-lg text-primary-dark/80 dark:text-dark-text-secondary max-w-2xl mx-auto">
            {t('home_promo_mobile_subtitle')}
          </p>
          <Button
            onClick={() => setCurrentPage(Page.MobileApp)}
            size="lg"
            variant="secondary"
            className="mt-8 px-8 py-3 text-base font-semibold"
          >
            {t('home_promo_mobile_cta')}
          </Button>
           {/* Spotlight Effect Div */}
           <MobilePromoSpotlight />
        </div>
      </section>
    </PageContainer>
  );
};