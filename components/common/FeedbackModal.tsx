import React, { useState } from 'react';
import { Button } from './Button';
import { StarIcon, CheckCircleIcon } from '../../constants';
import { useLanguage } from '../../contexts/LanguageContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsLoading(true);
    setError('');
    try {
        await onSubmit(rating, comment);
        setIsSubmitted(true);
        setTimeout(() => {
            onClose();
            // Reset for next time modal opens
            setRating(0);
            setComment('');
            setIsSubmitted(false);
        }, 2000);
    } catch (err) {
        setError('Failed to submit feedback. Please try again.');
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    // Reset state on close without submitting
    setRating(0);
    setComment('');
    setIsSubmitted(false);
    setError('');
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full transform transition-all" onClick={(e) => e.stopPropagation()}>
        {isSubmitted ? (
            <div className="text-center py-8">
                <CheckCircleIcon className="w-16 h-16 text-success mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-primary-dark dark:text-dark-text-primary mb-2">{t('feedback_thanks_title')}</h2>
                <p className="text-primary-dark/80 dark:text-dark-text-secondary">{t('feedback_thanks_message')}</p>
            </div>
        ) : (
            <>
                <h2 className="text-2xl font-bold text-primary-dark dark:text-dark-text-primary mb-2">{t('feedback_title')}</h2>
                <p className="text-sm text-primary-dark/80 dark:text-dark-text-secondary mb-6">{t('feedback_subtitle')}</p>
                
                <div className="flex justify-center items-center mb-6" aria-label="Rate your experience">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      aria-label={`${star} star`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-dark-accent rounded-full p-1"
                    >
                      <StarIcon className={`w-10 h-10 cursor-pointer transition-all duration-150 transform hover:scale-110 ${star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-dark-border'}`} />
                    </button>
                  ))}
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('feedback_comment_placeholder')}
                  className="w-full p-3 border border-gray-300 dark:border-dark-border rounded-md h-24 focus:ring-2 focus:ring-accent dark:focus:ring-dark-accent focus:border-accent dark:focus:border-dark-accent transition-shadow bg-white dark:bg-dark-background dark:text-dark-text-primary dark:placeholder-dark-text-secondary/60"
                  aria-label="Feedback comment"
                />

                {error && <p className="text-danger text-sm mt-2 text-center">{error}</p>}

                <div className="mt-6 flex justify-end gap-4">
                  <Button variant="outline" onClick={handleClose}>{t('feedback_close_button')}</Button>
                  <Button onClick={handleSubmit} isLoading={isLoading} disabled={rating === 0 || isLoading}>{t('feedback_submit_button')}</Button>
                </div>
            </>
        )}
      </div>
    </div>
  );
};