
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
      <label htmlFor={id} className="block text-sm font-medium text-primary-dark mb-1">
        {label}
      </label>
      <div className="relative mt-1">
          <input
            id={id}
            className={`block w-full px-3 py-2 border ${error ? 'border-danger' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white ${endIcon ? 'pr-10' : ''} ${className || ''}`}
            {...props}
          />
          {endIcon && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                  <button type="button" onClick={onEndIconClick} className="focus:outline-none focus:ring-2 focus:ring-accent rounded-md p-1" aria-label="Toggle password visibility">
                    {endIcon}
                  </button>
              </div>
          )}
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};
