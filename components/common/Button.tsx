import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

// Define the props that are specific to our Button component.
// Using a generic <E> that extends React.ElementType allows for polymorphism.
type ButtonOwnProps<E extends React.ElementType> = {
  as?: E;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
};

// Create the final ButtonProps type. It combines our own props
// with the props of the element being rendered (e.g., 'button', 'a', 'span').
// We use Omit to prevent conflicts between our props and the element's native props.
type ButtonProps<E extends React.ElementType> = ButtonOwnProps<E> &
  Omit<React.ComponentPropsWithoutRef<E>, keyof ButtonOwnProps<E>>;

// Set the default element to 'button' if no 'as' prop is provided.
const defaultElement = 'button';

// The component is now a generic function, which is necessary for polymorphic components in TypeScript.
export const Button = <E extends React.ElementType = typeof defaultElement>({
  children,
  as,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  ...props
}: ButtonProps<E>) => {
  const Tag = as || defaultElement;

  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantStyles = {
    primary: 'bg-btn-primary-bg text-btn-primary-text hover:bg-btn-primary-hover focus:ring-accent dark:bg-dark-accent dark:text-primary-dark dark:hover:bg-dark-accent-hover dark:focus:ring-dark-accent',
    secondary: 'bg-accent text-white hover:bg-accent-hover focus:ring-accent dark:bg-dark-border dark:text-dark-text-primary dark:hover:bg-dark-border/80 dark:focus:ring-dark-accent',
    outline: 'border border-primary-dark text-primary-dark hover:bg-primary-dark/10 focus:ring-primary-dark dark:border-dark-border dark:text-dark-text-primary dark:hover:bg-dark-border/30 dark:focus:ring-dark-accent',
    ghost: 'text-primary-dark hover:bg-primary-dark/10 focus:ring-primary-dark dark:text-dark-text-primary dark:hover:bg-dark-border/30 dark:focus:ring-dark-accent',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  // The 'disabled' prop is only valid on certain elements. We cast `props` to `any`
  // as a pragmatic way to check for `disabled` without complex conditional types.
  // React will ignore the `disabled` attribute on elements that don't support it (like <span>).
  const isDisabled = isLoading || (props as any).disabled;

  return (
    <Tag
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? <LoadingSpinner size="sm" /> : children}
    </Tag>
  );
};