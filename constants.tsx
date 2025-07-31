import React from 'react';
import { Feature } from './types';
import { TranslationKeys } from './localization/en';
import { useTheme } from './contexts/ThemeContext';

// APP_NAME, APP_MOTTO, etc., are now in localization files.
// FOOTER_TEXT, MISSION_STATEMENT, RESULTS_DISCLAIMER, PAYMENT_PLACEHOLDER_TEXT are also moved.

const LOGO_COLOR_URL = "https://storage.googleapis.com/felipec-_bucket/Artboard%207-8.png";
const LOGO_WHITE_URL = "https://storage.googleapis.com/felipec-_bucket/Artboard%208-8.png";

export const EyeIcon: React.FC<{ className?: string; forceColor?: boolean }> = ({ className = "w-20 h-20", forceColor = false }) => {
    // If forceColor is true, we ONLY render the color logo, ignoring the theme.
    // This is crucial for components like the PDF report which always have a white background.
    if (forceColor) {
        return (
            <div className={className} aria-label="Niria Logo">
                <img src={LOGO_COLOR_URL} alt="Niria Logo" className="w-full h-full object-contain" />
            </div>
        );
    }
    
    // Default behavior for the web page, switching based on theme.
    return (
        <div className={className} aria-label="Niria Logo">
            <img src={LOGO_COLOR_URL} alt="Niria Logo" className="w-full h-full object-contain block dark:hidden" />
            <img src={LOGO_WHITE_URL} alt="Niria Logo" className="w-full h-full object-contain hidden dark:block" />
        </div>
    );
};


export const SpeedIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10 text-accent" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const FeatureSpeedIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8 text-accent dark:text-dark-accent" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);
const FeatureDeviceIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8 text-accent dark:text-dark-accent" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
  </svg>
);
const FeatureAccuracyIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8 text-accent dark:text-dark-accent" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 .75l-1.5-1.5M21 10.5l-1.5 1.5M21 13.5l-1.5-1.5M4.5 13.5l-1.5 1.5M12 3v1.5m0 15V21m-6.75-1.5l-1.5 1.5M21 19.5l-1.5-1.5M17.25 21v-1.5M12 17.25a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75h-2.25a.75.75 0 01-.75-.75V17.25zM9.75 15.75a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75h-2.25a.75.75 0 01-.75-.75V15.75zM5.25 12a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V12zM5.25 7.5a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V7.5zM9.75 9a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75h-2.25a.75.75 0 01-.75-.75V9zM14.25 6a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75h-2.25a.75.75 0 01-.75-.75V6z" />
  </svg>
);
const FeatureSecureIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8 text-accent dark:text-dark-accent" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
  </svg>
);

export const getFeaturesList = (t: (key: keyof TranslationKeys) => string): Feature[] => [
  {
    icon: <FeatureSpeedIcon />,
    titleKey: t('feature_resultsInMinutes_title'),
    descriptionKey: t('feature_resultsInMinutes_description')
  },
  {
    icon: <FeatureDeviceIcon />,
    titleKey: t('feature_noExpensiveEquipment_title'),
    descriptionKey: t('feature_noExpensiveEquipment_description')
  },
  {
    icon: <FeatureAccuracyIcon />,
    titleKey: t('feature_highAccuracyPotential_title'),
    descriptionKey: t('feature_highAccuracyPotential_description')
  },
   {
    icon: <FeatureSecureIcon />,
    titleKey: t('feature_securePrivate_title'),
    descriptionKey: t('feature_securePrivate_description')
  }
];


export const UploadIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6 mr-2" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
  </svg>
);

export const CameraIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6 mr-2" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
  </svg>
);

export const InfoIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 inline mr-1" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
);

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6 text-success" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6 text-warning" }) => (
   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);

export const XCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6 text-danger" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const LightbulbIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6 text-accent" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.354a7.5 7.5 0 0 1-4.5 0m4.5 0v-.375c0-.621-.504-1.125-1.125-1.125h-1.5c-.621 0-1.125.504-1.125 1.125v.375m-3.75 0V5.625A2.625 2.625 0 0 1 8.25 3h7.5a2.625 2.625 0 0 1 2.625 2.625v9.375m0-9.375c.375.625.625 1.375.625 2.25V18a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18V7.875c0-.875.25-1.625.625-2.25M12 18V3M12 18h.008v.008H12v-.008Z" />
  </svg>
);

export const ShowPasswordIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 text-gray-500" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

export const HidePasswordIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 text-gray-500" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.243 4.243L6.228 6.228" />
    </svg>
);

export const StarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434L10.788 3.21z" clipRule="evenodd" />
    </svg>
);

export const EyeMaskOverlay: React.FC = () => (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
            <mask id="eye-mask">
                {/* White rectangle covers everything */}
                <rect width="1600" height="900" fill="white" />
                {/* Black ellipses punch holes for the eyes, now much larger */}
                <ellipse cx="500" cy="450" rx="250" ry="200" fill="black" />
                <ellipse cx="1100" cy="450" rx="250" ry="200" fill="black" />
            </mask>
        </defs>
        {/* The dark overlay, masked by the definition above */}
        <rect width="1600" height="900" fill="rgba(0, 0, 0, 0.7)" mask="url(#eye-mask)" />

        {/* Dashed lines for guidance, drawn separately on top */}
        <ellipse cx="500" cy="450" rx="250" ry="200" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="5" strokeDasharray="15 15" />
        <ellipse cx="1100" cy="450" rx="250" ry="200" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="5" strokeDasharray="15 15" />
    </svg>
);


export const MenuIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

export const XIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const UsersGroupIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.75 3.75 0 015.25 0m-5.25 0a3.75 3.75 0 00-5.25 0m7.5-3.375c0-1.036.84-1.875 1.875-1.875h.375c1.036 0 1.875.84 1.875 1.875v.375c0 1.036-.84 1.875-1.875 1.875h-.375C9.34 12.875 8.5 12.036 8.5 11v-.375zM6.375 12.375a3.75 3.75 0 015.25 0m-5.25 0a3.75 3.75 0 00-5.25 0m12.75 0a3.75 3.75 0 015.25 0m-5.25 0a3.75 3.75 0 00-5.25 0" />
    </svg>
);

export const ShieldCheckIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
    </svg>
);

export const SparklesIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.573L16.5 21.75l-.398-1.177a3.375 3.375 0 00-2.455-2.456L12.75 18l1.177-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.177a3.375 3.375 0 002.456 2.455L20.25 18l-1.177.398a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);

export const StethoscopeIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 0A2.25 2.25 0 015.5 7.5h13a2.25 2.25 0 012.25 2.25m-17.5 0v6.75a2.25 2.25 0 002.25 2.25h13a2.25 2.25 0 002.25-2.25V9.75M9 13.5a3 3 0 00-3 3v2.25a3 3 0 003 3h6a3 3 0 003-3v-2.25a3 3 0 00-3-3H9z" />
    </svg>
);

export const UserIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const DocumentTextIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

export const BriefcaseIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.415a26.61 26.61 0 01-1.489.698m-12.158 0A26.61 26.61 0 013 15.582m12.158 0c-1.043-.482-2.148-.872-3.29-1.125a48.342 48.342 0 00-6.378 0c-1.142.253-2.247.643-3.29 1.125m16.5 0A2.18 2.18 0 0019.5 12.5v-1.5a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 11v1.5a2.18 2.18 0 00.75 1.661m16.5 0h-16.5" />
    </svg>
);

export const SunIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
);

export const MoonIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
);

export const CheckIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

export const CameraCaptureIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z" />
    </svg>
);

export const AnalyzeIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const ReportIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

export const ConnectIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
);

export const AIIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 .75l-1.5-1.5M21 10.5l-1.5 1.5M21 13.5l-1.5-1.5M4.5 13.5l-1.5 1.5M12 3v1.5m0 15V21m-6.75-1.5l-1.5 1.5M21 19.5l-1.5-1.5M17.25 21v-1.5M12 17.25a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75h-2.25a.75.75 0 01-.75-.75V17.25zM9.75 15.75a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75h-2.25a.75.75 0 01-.75-.75V15.75zM5.25 12a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V12zM5.25 7.5a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V7.5zM9.75 9a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75h-2.25a.75.75 0 01-.75-.75V9zM14.25 6a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75h-2.25a.75.75 0 01-.75-.75V6z" />
    </svg>
);

export const SpeakerWaveIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);

export const AppleAppStoreIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
    <img src="https://storage.googleapis.com/felipec-_bucket/apple_logo.png" alt="Apple App Store Logo" className={`${className} object-contain`} />
);

export const GooglePlayStoreIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
    <img src="https://storage.googleapis.com/felipec-_bucket/android.jpg" alt="Google Play Store Logo" className={`${className} object-contain`} />
);

export const AppStoreDownloadBadge: React.FC<{ className?: string }> = ({ className }) => (
    <div className={className}>
        {/* Light Mode Badge */}
        <svg viewBox="0 0 120 40" className="block dark:hidden">
            <rect width="120" height="40" rx="5" fill="black" />
            <path d="M8.2,19.5c0-2.3,1.6-4,4-4s4,1.7,4,4c0,2.2-1.6,4-4,4S8.2,21.7,8.2,19.5z M23.2,15.7v1.6h2.8v1.6h-2.8v4.6h-1.8V15.7H23.2z M31.6,15.7h1.8v8h2.8v1.6h-4.6V15.7z M41.6,20.5c0-2.8-2.1-5-5.1-5s-5.1,2.2-5.1,5c0,2.8,2.1,5,5.1,5S41.6,23.3,41.6,20.5z M33.2,20.5c0-1.8,1.3-3.2,3.3-3.2s3.3,1.4,3.3,3.2c0,1.8-1.3,3.2-3.3,3.2S33.2,22.3,33.2,20.5z M49.5,25.3h-1.8l-3.3-4.5v4.5h-1.8V15.7h1.8l3.3,4.5v-4.5h1.8V25.3z M59.6,15.7h1.8v8h2.8v1.6h-4.6V15.7z M66.4,20.5c0-2.8-2.1-5-5.1-5s-5.1,2.2-5.1,5c0,2.8,2.1,5,5.1,5S66.4,23.3,66.4,20.5z M58,20.5c0-1.8,1.3-3.2,3.3-3.2s3.3,1.4,3.3,3.2c0,1.8-1.3,3.2-3.3,3.2S58,22.3,58,20.5z M74.7,15.7l1.3,4.3h0.1l1.3-4.3h1.9v9.6h-1.8v-4.9h-0.1l-1.4,4.9h-1.3l-1.4-4.9h-0.1v4.9h-1.8V15.7H74.7z M83,23.6h4v1.7h-5.8V15.7h5.7v1.7h-3.9v2.2h3.5v1.7h-3.5V23.6z M92.2,15.7h1.8v9.6h-1.8V15.7z M98.4,20.5c0-2.8-2.1-5-5.1-5s-5.1,2.2-5.1,5c0,2.8,2.1,5,5.1,5S98.4,23.3,98.4,20.5z M90,20.5c0-1.8,1.3-3.2,3.3-3.2s3.3,1.4,3.3,3.2c0,1.8-1.3,3.2-3.3,3.2S90,22.3,90,20.5z M106.6,15.7v1.6h2.8v1.6h-2.8v4.6h-1.8V15.7H106.6z M113.1,19.3c0.6-0.5,1.1-1.2,1.1-2.1c0-1.5-1.1-2.4-3.1-2.4h-2.2v9.6h1.8v-3.7h1.4l2.2,3.7h2.1l-2.6-4.1C112.5,19.9,112.7,19.6,113.1,19.3z M109.1,16.4h1.7c1,0,1.5,0.4,1.5,1.1s-0.5,1.1-1.5,1.1h-1.7V16.4z" fill="white"/>
            <text x="60" y="12" textAnchor="middle" fontSize="6" fill="white">Download on the</text>
        </svg>
        {/* Dark Mode Badge */}
        <svg viewBox="0 0 120 40" className="hidden dark:block">
            <rect width="120" height="40" rx="5" fill="white" />
            <path d="M8.2,19.5c0-2.3,1.6-4,4-4s4,1.7,4,4c0,2.2-1.6,4-4,4S8.2,21.7,8.2,19.5z M23.2,15.7v1.6h2.8v1.6h-2.8v4.6h-1.8V15.7H23.2z M31.6,15.7h1.8v8h2.8v1.6h-4.6V15.7z M41.6,20.5c0-2.8-2.1-5-5.1-5s-5.1,2.2-5.1,5c0,2.8,2.1,5,5.1,5S41.6,23.3,41.6,20.5z M33.2,20.5c0-1.8,1.3-3.2,3.3-3.2s3.3,1.4,3.3,3.2c0,1.8-1.3,3.2-3.3,3.2S33.2,22.3,33.2,20.5z M49.5,25.3h-1.8l-3.3-4.5v4.5h-1.8V15.7h1.8l3.3,4.5v-4.5h1.8V25.3z M59.6,15.7h1.8v8h2.8v1.6h-4.6V15.7z M66.4,20.5c0-2.8-2.1-5-5.1-5s-5.1,2.2-5.1,5c0,2.8,2.1,5,5.1,5S66.4,23.3,66.4,20.5z M58,20.5c0-1.8,1.3-3.2,3.3-3.2s3.3,1.4,3.3,3.2c0,1.8-1.3,3.2-3.3,3.2S58,22.3,58,20.5z M74.7,15.7l1.3,4.3h0.1l1.3-4.3h1.9v9.6h-1.8v-4.9h-0.1l-1.4,4.9h-1.3l-1.4-4.9h-0.1v4.9h-1.8V15.7H74.7z M83,23.6h4v1.7h-5.8V15.7h5.7v1.7h-3.9v2.2h3.5v1.7h-3.5V23.6z M92.2,15.7h1.8v9.6h-1.8V15.7z M98.4,20.5c0-2.8-2.1-5-5.1-5s-5.1,2.2-5.1,5c0,2.8,2.1,5,5.1,5S98.4,23.3,98.4,20.5z M90,20.5c0-1.8,1.3-3.2,3.3-3.2s3.3,1.4,3.3,3.2c0,1.8-1.3,3.2-3.3,3.2S90,22.3,90,20.5z M106.6,15.7v1.6h2.8v1.6h-2.8v4.6h-1.8V15.7H106.6z M113.1,19.3c0.6-0.5,1.1-1.2,1.1-2.1c0-1.5-1.1-2.4-3.1-2.4h-2.2v9.6h1.8v-3.7h1.4l2.2,3.7h2.1l-2.6-4.1C112.5,19.9,112.7,19.6,113.1,19.3z M109.1,16.4h1.7c1,0,1.5,0.4,1.5,1.1s-0.5,1.1-1.5,1.1h-1.7V16.4z" fill="black"/>
            <text x="60" y="12" textAnchor="middle" fontSize="6" fill="black">Download on the</text>
        </svg>
    </div>
);

export const GooglePlayDownloadBadge: React.FC<{ className?: string }> = ({ className }) => (
    <div className={className}>
        {/* Light Mode Badge */}
        <svg viewBox="0 0 135 40" className="block dark:hidden">
            <rect width="135" height="40" rx="5" fill="black" />
            <path d="M11,14.2l-4.5,4.5l4.5,4.5l1.6-1.6l-2.9-2.9l2.9-2.9L11,14.2z M27.8,20c0,4.8-3.3,7-7.2,7s-7.2-2.2-7.2-7 c0-4.8,3.3-7,7.2-7S27.8,15.2,27.8,20z M26,20c0-3.6-2.2-5.4-5.4-5.4s-5.4,1.8-5.4,5.4s2.2,5.4,5.4,5.4S26,23.6,26,20z M35.3,13.2h1.8 v13.6h-1.8V13.2z M44.5,13.2h1.8l5.2,8.6l0.1,0V13.2h1.8v13.6h-1.8l-5.2-8.6l-0.1,0v8.6h-1.8V13.2z M60,13.2h1.8v13.6h-1.8V13.2z M72.5,20c0-4.8-3.3-7-7.2-7s-7.2,2.2-7.2,7c0,4.8,3.3,7,7.2,7S72.5,24.8,72.5,20z M70.7,20c0-3.6-2.2-5.4-5.4-5.4 s-5.4,1.8-5.4,5.4s2.2,5.4,5.4,5.4S70.7,23.6,70.7,20z M82,23.7l3.6-3.5h-3.6v-1.7h5.6v1.4l-3.6,3.5h3.7v1.7h-5.7V23.7z M92.5,13.2h1.8v13.6h-1.8V13.2z M100,20c0-4.8-3.3-7-7.2-7s-7.2,2.2-7.2,7c0,4.8,3.3,7,7.2,7S100,24.8,100,20z M98.2,20 c0-3.6-2.2-5.4-5.4-5.4s-5.4,1.8-5.4,5.4s2.2,5.4,5.4,5.4S98.2,23.6,98.2,20z M112.5,13.2h2.7c3,0,5,1.8,5,4.7c0,2.1-1.1,3.6-2.9,4.3 l3.2,4.8h-2.1l-2.9-4.5h-1.2v4.5h-1.8V13.2z M114.3,14.8v4.6h1.2c2,0,3.1-0.9,3.1-2.3c0-1.4-1.1-2.3-3-2.3H114.3z M123,23.7l3.6-3.5 h-3.6v-1.7h5.6v1.4l-3.6,3.5h3.7v1.7h-5.7V23.7z" fill="white"/>
            <text x="75" y="11" textAnchor="middle" fontSize="6" fill="white">GET IT ON</text>
        </svg>
        {/* Dark Mode Badge */}
        <svg viewBox="0 0 135 40" className="hidden dark:block">
            <rect width="135" height="40" rx="5" fill="white" />
            <path d="M11,14.2l-4.5,4.5l4.5,4.5l1.6-1.6l-2.9-2.9l2.9-2.9L11,14.2z M27.8,20c0,4.8-3.3,7-7.2,7s-7.2-2.2-7.2-7 c0-4.8,3.3-7,7.2-7S27.8,15.2,27.8,20z M26,20c0-3.6-2.2-5.4-5.4-5.4s-5.4,1.8-5.4,5.4s2.2,5.4,5.4,5.4S26,23.6,26,20z M35.3,13.2h1.8 v13.6h-1.8V13.2z M44.5,13.2h1.8l5.2,8.6l0.1,0V13.2h1.8v13.6h-1.8l-5.2-8.6l-0.1,0v8.6h-1.8V13.2z M60,13.2h1.8v13.6h-1.8V13.2z M72.5,20c0-4.8-3.3-7-7.2-7s-7.2,2.2-7.2,7c0,4.8,3.3,7,7.2,7S72.5,24.8,72.5,20z M70.7,20c0-3.6-2.2-5.4-5.4-5.4 s-5.4,1.8-5.4,5.4s2.2,5.4,5.4,5.4S70.7,23.6,70.7,20z M82,23.7l3.6-3.5h-3.6v-1.7h5.6v1.4l-3.6,3.5h3.7v1.7h-5.7V23.7z M92.5,13.2h1.8v13.6h-1.8V13.2z M100,20c0-4.8-3.3-7-7.2-7s-7.2,2.2-7.2,7c0,4.8,3.3,7,7.2,7S100,24.8,100,20z M98.2,20 c0-3.6-2.2-5.4-5.4-5.4s-5.4,1.8-5.4,5.4s2.2,5.4,5.4,5.4S98.2,23.6,98.2,20z M112.5,13.2h2.7c3,0,5,1.8,5,4.7c0,2.1-1.1,3.6-2.9,4.3 l3.2,4.8h-2.1l-2.9-4.5h-1.2v4.5h-1.8V13.2z M114.3,14.8v4.6h1.2c2,0,3.1-0.9,3.1-2.3c0-1.4-1.1-2.3-3-2.3H114.3z M123,23.7l3.6-3.5 h-3.6v-1.7h5.6v1.4l-3.6,3.5h3.7v1.7h-5.7V23.7z" fill="black"/>
            <text x="75" y="11" textAnchor="middle" fontSize="6" fill="black">GET IT ON</text>
        </svg>
    </div>
);