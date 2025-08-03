import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { TranslationKeys } from '../../localization/en';
import { useSpotlight } from '../../hooks/useSpotlight';

// Define the structure for a testimonial for type safety and clarity.
interface Testimonial {
  quoteKey: keyof TranslationKeys;
  nameKey: keyof TranslationKeys;
  roleKey: keyof TranslationKeys;
}

// Array of testimonial data using translation keys for easy localization.
const testimonials: Testimonial[] = [
  { quoteKey: 'testimonial1_quote', nameKey: 'testimonial1_name', roleKey: 'testimonial1_role' },
  { quoteKey: 'testimonial2_quote', nameKey: 'testimonial2_name', roleKey: 'testimonial2_role' },
  { quoteKey: 'testimonial3_quote', nameKey: 'testimonial3_name', roleKey: 'testimonial3_role' },
];

/**
 * A section that displays user testimonials in an auto-playing carousel with a smooth fade transition.
 * The content and style are designed to reinforce the brand's caring and trustworthy personality.
 */
export const TestimonialsSection: React.FC = () => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const { spotlightProps, Spotlight } = useSpotlight({ size: 600, color: 'rgba(59, 187, 217, 0.15)' });

  // Memoized callback to advance to the next slide. This prevents the useEffect from re-running unnecessarily.
  const advanceSlide = useCallback(() => {
    setIsFading(true); // Start fade-out effect.
    // Wait for the fade-out transition to complete before changing the content.
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
      setIsFading(false); // Start fade-in effect.
    }, 500); // This duration should be equal to the CSS transition for a smooth effect.
  }, []);

  // Set up the auto-play timer for the carousel.
  useEffect(() => {
    const timer = setInterval(advanceSlide, 7000); // Rotate testimonials every 7 seconds.
    return () => clearInterval(timer); // Clean up the interval when the component unmounts.
  }, [advanceSlide]);

  // Handler for manual navigation via dots.
  const goToSlide = (index: number) => {
    if (index === currentIndex) return; // Do nothing if the selected slide is already active.
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsFading(false);
    }, 500);
  };
  
  const currentTestimonial = testimonials[currentIndex];

  return (
    <div 
      className="relative overflow-hidden max-w-5xl mx-auto text-center p-8 sm:p-12 bg-white dark:bg-dark-card rounded-2xl shadow-xl"
      {...spotlightProps}
    >
        <h2 className="text-3xl sm:text-4xl font-bold mb-16 bg-gradient-to-r from-primary-dark to-accent bg-clip-text text-transparent dark:from-dark-text-primary dark:to-dark-accent">
          {t('home_testimonials_title')}
        </h2>

        <div className="relative min-h-[20rem] flex flex-col items-center justify-center">
          <div className={`transition-opacity duration-500 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}>
            <svg className="w-10 h-10 text-accent/30 dark:text-dark-accent/30 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6,17C4.89,17 4,16.11 4,15V11C4,9.89 4.89,9 6,9H10V7H6C3.79,7 2,8.79 2,11V15C2,17.21 3.79,19 6,19H10V17H6M18,17C16.89,17 16,16.11 16,15V11C16,9.89 16.89,9 18,9H22V7H18C15.79,7 14,8.79 14,11V15C14,17.21 15.79,19 18,19H22V17H18Z" />
            </svg>
            <blockquote className="text-xl italic text-primary-dark/90 dark:text-dark-text-secondary/90 leading-relaxed mb-6">
              {t(currentTestimonial.quoteKey)}
            </blockquote>
            <cite className="not-italic block">
              <span className="text-xl font-bold text-primary-dark dark:text-dark-text-primary">{t(currentTestimonial.nameKey)}</span>
              <span className="block text-base text-primary-dark/60 dark:text-dark-text-secondary/70 mt-1">{t(currentTestimonial.roleKey)}</span>
            </cite>
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center mt-12 space-x-3">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent dark:focus:ring-dark-accent ${
                currentIndex === index
                  ? 'bg-accent dark:bg-dark-accent scale-125'
                  : 'bg-gray-300 dark:bg-dark-border/50 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
        
        {/* Spotlight Effect Div */}
        <Spotlight />
      </div>
  );
};