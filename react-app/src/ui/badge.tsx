import * as React from 'react';
import { cn } from '@/utils/formatters';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  color?: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'slate' | 'indigo';
  className?: string;
}

const colorStyles = {
  red: 'bg-red-50 text-red-700 border-red-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  color = 'slate',
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variant === 'outline' ? 'border border-current' : '',
        colorStyles[color],
        className
      )}
    >
      {children}
    </span>
  );
};
