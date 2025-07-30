import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { Page } from '../types';

// Load Stripe with your PUBLISHABLE key
const stripePromise = loadStripe('pk_test_51RZlfLRwyUm5uH9otzGh1HF24S9DgPloL7w7dypTw7TUSfT4ry1UdvnqrzgdhFWd6wT9rFt7kaILS0brbtdI9gfe00HSOUNEYJ');

interface PaymentPageProps {
    setCurrentPage: (page: Page) => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({ setCurrentPage }) => {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckout = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // URL of the deployed Cloud Function.
            const functionUrl = 'https://us-central1-virtual-vision-test-app.cloudfunctions.net/createCheckoutSession';

            // Call your backend to create the checkout session
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const session = await response.json();

            if (!response.ok) {
                throw new Error(session.error || 'Failed to create checkout session.');
            }

            // Redirect user to Stripe Checkout
            const stripe = await stripePromise;
            if (stripe) {
                const { error } = await stripe.redirectToCheckout({
                    sessionId: session.id,
                });
                if (error) {
                    setError(error.message || 'An unexpected error occurred.');
                }
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageContainer title={t('payment_title')} className="max-w-lg mx-auto">
            <div className="bg-white dark:bg-dark-card p-8 rounded-xl shadow-2xl text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-accent dark:text-dark-accent mx-auto mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>

                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary-dark to-accent bg-clip-text text-transparent dark:from-dark-text-primary dark:to-dark-accent">{t('payment_unlock_title')}</h2>
                <p className="text-primary-dark/80 dark:text-dark-text-secondary mb-6">{t('payment_unlock_description')}</p>
                
                <div className="my-6 p-4 bg-accent/10 dark:bg-dark-accent/10 rounded-lg">
                    <div className="text-5xl font-extrabold text-accent dark:text-dark-accent">$10.00 <span className="text-lg font-normal text-primary-dark/60 dark:text-dark-text-secondary/60">USD</span></div>
                    <p className="text-sm text-primary-dark/60 dark:text-dark-text-secondary/60 mt-1">One-time payment</p>
                </div>

                <Button onClick={handleCheckout} isLoading={isLoading} size="lg" className="w-full">
                    {isLoading ? t('payment_processing') : t('payment_pay_now_button')}
                </Button>
                {error && <p className="text-danger mt-4 text-sm">{error}</p>}

                <div className="mt-6 text-center text-xs text-primary-dark/60 dark:text-dark-text-secondary/80">
                    <span>{t('payment_support_prompt')} </span>
                    <button onClick={() => setCurrentPage(Page.Support)} className="font-semibold text-accent dark:text-dark-accent hover:underline">
                        {t('payment_support_link')}
                    </button>
                </div>
            </div>
        </PageContainer>
    );
};