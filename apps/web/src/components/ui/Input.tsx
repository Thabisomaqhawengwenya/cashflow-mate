import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-md-on-surface-variant">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 text-md-on-surface-variant pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full h-11 px-3.5 ${
            icon ? 'pl-10' : ''
          } bg-md-surface-container-low border text-md-on-surface text-sm rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-md-primary/80 focus:border-md-primary ${
            error
              ? 'border-md-error focus:ring-md-error'
              : 'border-md-outline-variant hover:border-md-outline'
          } ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <span className="text-xs text-md-error font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-md-on-surface-variant/80">{helperText}</span>
      ) : null}
    </div>
  );
};
