import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  helperText,
  error,
  options,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-md-on-surface-variant">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full h-11 px-3.5 bg-md-surface-container-low border text-md-on-surface text-sm rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-md-primary/80 focus:border-md-primary cursor-pointer ${
          error
            ? 'border-md-error focus:ring-md-error'
            : 'border-md-outline-variant hover:border-md-outline'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-md-surface-container text-md-on-surface">
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <span className="text-xs text-md-error font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-md-on-surface-variant/80">{helperText}</span>
      ) : null}
    </div>
  );
};
