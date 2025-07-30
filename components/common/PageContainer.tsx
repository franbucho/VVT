import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, title, className }) => {
  return (
    <div className={`container mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className || ''}`}>
      {title && (
        <h1 className="text-center text-3xl sm:text-4xl font-bold tracking-tight mb-6 sm:mb-8 bg-gradient-to-r from-primary-dark to-accent bg-clip-text text-transparent dark:from-dark-text-primary dark:to-dark-accent">
          {title}
        </h1>
      )}
      {children}
    </div>
  );
};