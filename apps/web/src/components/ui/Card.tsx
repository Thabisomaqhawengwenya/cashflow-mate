import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'container' | 'elevated' | 'high' | 'outlined';
  shape?: 'md' | 'lg' | 'xl';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  shape = 'lg',
  padding = 'md',
  className = '',
  ...props
}) => {
  const variantClasses = {
    container: 'bg-md-surface-container text-md-on-surface',
    elevated: 'bg-md-surface-container-lowest text-md-on-surface shadow-sm border border-md-outline-variant/30',
    high: 'bg-md-surface-container-high text-md-on-surface',
    outlined: 'bg-md-surface text-md-on-surface border border-md-outline-variant'
  }[variant];

  const shapeClasses = {
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl'
  }[shape];

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6 sm:p-7'
  }[padding];

  return (
    <div
      className={`transition-colors duration-150 ${variantClasses} ${shapeClasses} ${paddingClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
