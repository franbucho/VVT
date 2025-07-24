import React, { useRef, useState, useEffect } from 'react';
import { Page } from '../types';
import { Button } from '../components/common/Button';
import { FeatureCard } from '../components/home/FeatureCard';
import { PageContainer } from '../components/common/PageContainer';
import { getFeaturesList } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { DynamicTextRotator } from '../components/home/DynamicTextRotator';
import { TestimonialsSection } from '../components/home/TestimonialsSection';

interface HomePageProps {
  setCurrentPage: (page: Page) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setCurrentPage }) => {
  const { t } = useLanguage();
  const features = getFeaturesList(t);
  const featuresRef = useRef<HTMLDivElement>(null);
  const [featuresVisible, setFeaturesVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFeaturesVisible(true);
          observer.unobserve(entry.target); // Observe only once
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.2 // Trigger when 20% of the section is visible
      }
    );

    const currentFeaturesRef = featuresRef.current;
    if (currentFeaturesRef) {
      observer.observe(currentFeaturesRef);
    }

    return () => {
      if (currentFeaturesRef) {
        observer.unobserve(currentFeaturesRef);
      }
    };
  }, []);

  const rotatingTexts = [
    { title: t('home_mission_title'), text: t('home_mission_text') },
    { title: t('home_vision_title'), text: t('home_vision_text') },
    { title: t('home_fact_title'), text: t('home_fact1') },
    { title: t('home_fact_title'), text: t('home_fact2') },
    { title: t('home_fact_title'), text: t('home_fact3') },
    { title: t('home_fact_title'), text: t('home_fact4') },
  ];

  return (
    <PageContainer>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-transparent rounded-3xl shadow-2xl my-12">
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
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 py-28 md:py-40 text-white flex flex-col items-center">
          <h1 className="text-5xl md:text-6xl font-bold leading-snug max-w-4xl drop-shadow-xl">
            {t('appMotto')}
          </h1>
          <p className="mt-6 text-xl md:text-2xl max-w-2xl text-white/90">
            {t('appSubMotto')}
          </p>
          <Button
            onClick={() => setCurrentPage(Page.Auth)}
            size="lg"
            variant="primary"
            className="mt-10 px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-2xl transform transition-transform hover:scale-105"
          >
            {t('home_ctaButton')}
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-dark dark:text-dark-text-primary text-center mb-12 md:mb-16">
            {t('home_whyChooseNiria')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ease-out ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <FeatureCard feature={feature} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Dynamic Info Section */}
      <section id="mission" className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto text-center">
           <div className="relative min-h-[20rem] flex flex-col items-center justify-center p-8 sm:p-12 bg-white dark:bg-dark-card rounded-2xl shadow-xl overflow-hidden">
            <DynamicTextRotator items={rotatingTexts} />
          </div>
        </div>
      </section>
    </PageContainer>
  );
};