import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '../../constants';

export const ThemeSwitcher: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-primary-dark hover:bg-primary-dark/10 dark:text-dark-text-secondary dark:hover:bg-dark-border/50 focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-dark-accent transition-colors"
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