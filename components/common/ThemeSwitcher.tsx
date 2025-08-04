import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '../../constants';

interface ThemeSwitcherProps {
  variant?: 'header' | 'panel';
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ variant = 'header' }) => {
  const { theme, toggleTheme } = useTheme();

  const baseClasses = "p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-dark-accent transition-colors";
  
  const headerClasses = 'text-primary-dark hover:bg-primary-dark/10 dark:text-dark-text-secondary dark:hover:bg-dark-border/50';
  const panelClasses = 'text-white hover:bg-white/20';
  
  const variantClasses = variant === 'panel' ? panelClasses : headerClasses;

  return (
    <button
      onClick={toggleTheme}
      className={`${baseClasses} ${variantClasses}`}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <MoonIcon className="w-5 h-5" />
      ) : (
        <SunIcon className="w-5 h-5" />
      )}
    </button>
  );
};
