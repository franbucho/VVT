import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  endIcon?: React.ReactNode;
  onEndIconClick?: () => void;
  wrapperClassName?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, id, error, className, endIcon, onEndIconClick, wrapperClassName, ...props }) => {
  return (
    <div className={`mb-4 ${wrapperClassName || ''}`}>
      <label htmlFor={id} className="block text-sm font-medium text-primary-dark dark:text-dark-text-secondary mb-1">
        {label}
      </label>
      <div className="relative mt-1">
          <input
            id={id}
            className={`block w-full px-3 py-2 border ${error ? 'border-danger' : 'border-gray-300 dark:border-dark-border'} rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white dark:bg-dark-card dark:text-dark-text-primary dark:placeholder-dark-text-secondary/60 ${endIcon ? 'pr-10' : ''} ${className || ''}`}
            {...props}
          />
          {endIcon && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-dark-text-secondary">
                  <button type="button" onClick={onEndIconClick} className="focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-dark-accent rounded-md p-1" aria-label="Toggle password visibility">
                    {endIcon}
                  </button>
              </div>
          )}
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};