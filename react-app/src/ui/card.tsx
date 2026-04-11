import * as React from 'react';
import { cn } from '@/utils/formatters';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const cardStyles = cn(
    'rounded-lg shadow-sm transition-all duration-200',
    variant === 'elevated' && 'border border-slate-200'
  );

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-slate-200',
        variant === 'outline' ? 'border border-slate-200' : '',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
};
