import * as React from 'react';
import { cn } from '@/utils/formatters';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const hasError = !!error;
  const focusedState = isFocused || hasError;
  const baseStyle = cn(
    'block w-full border rounded-md px-3 py-2 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0',
    focusedState && !hasError
      ? 'border-indigo-500 bg-indigo-50 focus:ring-indigo-500'
      : hasError
      ? 'border-red-500 bg-red-50 focus:ring-red-500'
      : 'border-slate-300 bg-white hover:border-slate-400 focus:ring-indigo-500'
  );

  return (
    <div className="w-full">
      {label && (
        <label
          className="block text-sm font-medium text-slate-700 mb-1.5"
          htmlFor={props.id}
        >
          {label}
        </label>
      )}
      <input
        className={baseStyle}
        id={props.id}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};
