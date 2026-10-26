import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'pill' | 'fab';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'filled',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-5 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5'
  }[size];

  const variantClasses = {
    filled:
      'bg-md-primary text-md-on-primary shadow-sm hover:shadow hover:brightness-105 active:scale-[0.98] rounded-md font-medium',
    tonal:
      'bg-md-secondary-container text-md-on-secondary-container hover:brightness-105 active:scale-[0.98] rounded-md font-medium',
    outlined:
      'border border-md-outline text-md-primary hover:bg-md-primary/5 active:scale-[0.98] rounded-md font-medium',
    text:
      'text-md-primary hover:bg-md-primary/10 active:scale-[0.98] rounded-md font-medium',
    pill:
      'bg-md-primary text-md-on-primary hover:brightness-105 active:scale-[0.98] rounded-full font-medium shadow-sm',
    fab:
      'bg-md-primary-container text-md-on-primary-container hover:brightness-105 active:scale-[0.96] rounded-xl shadow-md p-4 font-medium'
  }[variant];

  return (
    <button
      className={`inline-flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-primary disabled:opacity-50 disabled:pointer-events-none ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        icon
      )}
      {children}
    </button>
  );
};
