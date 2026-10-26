import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'inflow' | 'outflow' | 'neutral' | 'review' | 'flagged' | 'primary' | 'secondary';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const variantClasses = {
    inflow: 'bg-finance-inflow-container text-finance-inflow border border-finance-inflow/20',
    outflow: 'bg-finance-outflow-container text-finance-outflow border border-finance-outflow/20',
    neutral: 'bg-finance-neutral-container text-finance-neutral border border-finance-neutral/20',
    review: 'bg-finance-review-container text-finance-review border border-finance-review/20 font-medium',
    flagged: 'bg-finance-flagged-container text-finance-flagged border border-finance-flagged/20',
    primary: 'bg-md-primary-container text-md-on-primary-container',
    secondary: 'bg-md-secondary-container text-md-on-secondary-container'
  }[variant];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs font-medium gap-1.5'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full leading-none whitespace-nowrap transition-colors ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
};
