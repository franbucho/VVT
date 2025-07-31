import React from 'react';
import { Page } from '../types';
import { Button } from '../components/common/Button';
import { PageContainer } from '../components/common/PageContainer';
import { useLanguage } from '../contexts/LanguageContext';
import { CheckIcon } from '../constants';
import firebase from 'firebase/compat/app';
import { useSpotlight } from '../hooks/useSpotlight';

interface PricingPageProps {
  setCurrentPage: (page: Page) => void;
  currentUser: firebase.User | null;
}

export const PricingPage: React.FC<PricingPageProps> = ({ setCurrentPage, currentUser }) => {
  const { t } = useLanguage();

  const { spotlightProps: individualProps, Spotlight: IndividualSpotlight } = useSpotlight();
  const { spotlightProps: plusProps, Spotlight: PlusSpotlight } = useSpotlight({size: 500, color: 'rgba(59, 187, 217, 0.2)'});
  const { spotlightProps: businessProps, Spotlight: BusinessSpotlight } = useSpotlight();

  const handlePlanSelection = () => {
    // The current app flow doesn't support pre-selecting a plan.
    // Payment happens after analysis. So, we'll guide the user to the standard flow.
    if (currentUser) {
      setCurrentPage(Page.Exam);
    } else {
      setCurrentPage(Page.Auth);
    }
  };

  const handleContactSales = () => {
    setCurrentPage(Page.Support);
  };

  const PlanFeature: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start">
      <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
      <span className="text-primary-dark/90 dark:text-dark-text-secondary">{children}</span>
    </li>
  );

  return (
    <PageContainer>
      <section className="text-center py-12 md:py-20">
        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary-dark to-accent bg-clip-text text-transparent dark:from-dark-text-primary dark:to-dark-accent">
          {t('pricing_title')}
        </h1>
        <p className="mt-4 text-lg text-primary-dark/80 dark:text-dark-text-secondary max-w-2xl mx-auto">
          {t('pricing_subtitle')}
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto pb-20 items-center">
        
        {/* Plan 1: Individual */}
        <div {...individualProps} className="relative overflow-hidden flex flex-col border border-gray-200 dark:border-dark-border rounded-2xl p-8 shadow-lg bg-white dark:bg-dark-card h-full">
          <h3 className="text-2xl font-bold text-primary-dark dark:text-dark-text-primary">{t('pricing_plan_individual_title')}</h3>
          <p className="mt-4 text-primary-dark/80 dark:text-dark-text-secondary">
            <span className="text-4xl font-extrabold text-primary-dark dark:text-dark-text-primary">{t('pricing_plan_individual_price')}</span>
            <span className="text-base font-medium"> / {t('pricing_plan_individual_frequency')}</span>
          </p>
          <ul className="mt-8 space-y-4 text-sm flex-grow">
            <PlanFeature>{t('pricing_plan_individual_feature1')}</PlanFeature>
            <PlanFeature>{t('pricing_plan_individual_feature2')}</PlanFeature>
            <PlanFeature>{t('pricing_plan_individual_feature3')}</PlanFeature>
          </ul>
          <Button onClick={handlePlanSelection} variant="outline" className="mt-8 w-full">{t('pricing_cta_get_started')}</Button>
          <IndividualSpotlight />
        </div>

        {/* Plan 2: Wellness Pack (Highlighted) */}
        <div className="relative lg:scale-105 z-10">
            <div {...plusProps} className="relative overflow-hidden flex flex-col border-2 border-accent dark:border-dark-accent rounded-2xl p-8 shadow-2xl bg-white dark:bg-dark-card h-full">
              <h3 className="text-2xl font-bold text-primary-dark dark:text-dark-text-primary">{t('pricing_plan_plus_title')}</h3>
              <p className="mt-4 text-primary-dark/80 dark:text-dark-text-secondary">
                <span className="text-4xl font-extrabold text-primary-dark dark:text-dark-text-primary">{t('pricing_plan_plus_price')}</span>
                <span className="text-base font-medium"> / {t('pricing_plan_plus_frequency')}</span>
              </p>
              <ul className="mt-8 space-y-4 text-sm flex-grow">
                <PlanFeature>{t('pricing_plan_plus_feature1')}</PlanFeature>
                <PlanFeature>{t('pricing_plan_plus_feature2')}</PlanFeature>
              </ul>
              <Button onClick={handlePlanSelection} variant="primary" className="mt-8 w-full">{t('pricing_cta_choose_plus')}</Button>
              <PlusSpotlight />
            </div>
            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <span className="bg-accent dark:bg-dark-accent text-white dark:text-primary-dark text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full">{t('pricing_best_value')}</span>
            </div>
        </div>


        {/* Plan 3: Business */}
        <div {...businessProps} className="relative overflow-hidden flex flex-col border border-gray-200 dark:border-dark-border rounded-2xl p-8 shadow-lg bg-white dark:bg-dark-card h-full">
          <h3 className="text-2xl font-bold text-primary-dark dark:text-dark-text-primary">{t('pricing_plan_business_title')}</h3>
          <p className="mt-4 text-primary-dark/80 dark:text-dark-text-secondary">
            <span className="text-4xl font-extrabold text-primary-dark dark:text-dark-text-primary">{t('pricing_plan_business_price')}</span>
            <span className="text-base font-medium"> / {t('pricing_plan_business_frequency')}</span>
          </p>
          <ul className="mt-8 space-y-4 text-sm flex-grow">
            <PlanFeature>{t('pricing_plan_business_feature1')}</PlanFeature>
            <PlanFeature>{t('pricing_plan_business_feature2')}</PlanFeature>
            <PlanFeature>{t('pricing_plan_business_feature3')}</PlanFeature>
            <PlanFeature>{t('pricing_plan_business_feature4')}</PlanFeature>
          </ul>
          <Button onClick={handleContactSales} variant="outline" className="mt-8 w-full">{t('pricing_cta_contact_sales')}</Button>
          <BusinessSpotlight />
        </div>

      </section>
    </PageContainer>
  );
};