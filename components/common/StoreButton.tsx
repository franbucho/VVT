import React from 'react';
import { AppleAppStoreIcon, GooglePlayStoreIcon } from '../../constants';
import { useLanguage } from '../../contexts/LanguageContext';

interface StoreButtonProps {
  store: 'apple' | 'google';
  disabled?: boolean;
}

export const StoreButton: React.FC<StoreButtonProps> = ({ store, disabled = false }) => {
    const { t } = useLanguage();

    const storeDetails = {
        apple: {
          icon: <AppleAppStoreIcon className="w-8 h-8" />,
          textLine1: t('mobile_download_on'),
          textLine2: 'App Store',
        },
        google: {
          icon: <GooglePlayStoreIcon className="w-8 h-8" />,
          textLine1: t('mobile_get_it_on'),
          textLine2: 'Google Play',
        },
    };

    const { icon, textLine1, textLine2 } = storeDetails[store];

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center px-6 py-3 rounded-lg transition-colors duration-300
        ${disabled
          ? 'bg-gray-200 dark:bg-dark-border/50 text-gray-400 dark:text-dark-text-secondary/50 cursor-not-allowed'
          : 'bg-primary-dark dark:bg-dark-card text-white dark:text-dark-text-primary hover:bg-black/80 dark:hover:bg-dark-border'
        }`}
    >
      <div className="mr-4">
        {icon}
      </div>
      <div className="text-left">
        <div className="text-xs uppercase">{disabled ? t('mobile_coming_soon') : textLine1}</div>
        <div className="text-xl font-semibold -mt-1">{textLine2}</div>
      </div>
    </button>
  );
};