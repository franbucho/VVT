
import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, title, className }) => {
  return (
    <div className={`container mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className || ''}`}>
      {title && <h1 className="text-3xl font-bold text-primary mb-6">{title}</h1>}
      {children}
    </div>
  );
};