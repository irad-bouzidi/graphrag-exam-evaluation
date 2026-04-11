import * as React from 'react';
import { SelectRoot, SelectTrigger, SelectValue, SelectItem, SelectContent, SelectIndicator } from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/formatters';

export interface SelectProps {
  children?: React.ReactNode;
  disabled?: boolean;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  onValueChange?: (value: string) => void;
}

export const Select: React.FC<SelectProps> = ({
  children,
  disabled,
  defaultValue,
  placeholder,
  className,
  onValueChange,
}) => {
  const ref = React.useRef<HTMLSelectElement>(null);

  return (
    <SelectRoot
      defaultValue={defaultValue}
      value={defaultValue}
      onValueChange={(val) => onValueChange?.(val)}
      disabled={disabled}
    >
      <SelectTrigger className={cn('w-full border rounded-md px-3 py-2 text-sm transition-colors duration-200', disabled && 'cursor-not-allowed opacity-50 bg-slate-100 border-slate-200', className)}>
        <SelectValue placeholder={placeholder} />
        <SelectIndicator className="ml-auto text-slate-500">
          <ChevronDown className="h-4 w-4" />
        </SelectIndicator>
      </SelectTrigger>
      <SelectContent className="z-50 rounded-md border border-slate-200 bg-white shadow-lg overflow-hidden max-h-60 py-2">
        {children}
      </SelectContent>
    </SelectRoot>
  );
};
