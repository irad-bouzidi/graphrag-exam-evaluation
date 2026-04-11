import * as React from 'react';
import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogOverlay,
  DialogOverlayClose,
} from '@radix-ui/react-dialog';
import { cn } from '@/utils/formatters';

export interface DialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  children,
  open,
  onOpenChange,
  title,
  description,
  footer,
  className,
}) => {
  const overlayRef = React.useRef<HTMLDivElement>(null);

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogOverlay
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm',
          className
        )}
        onPointerDownOutside={(e) => {
          if (overlayRef.current && overlayRef.current === document.activeElement) {
            e.preventDefault();
            onOpenChange?.(false);
          }
        }}
      >
        <div
          ref={overlayRef}
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-[60]"
        >
          <DialogOverlayClose className="absolute top-4 right-4" />

          {title && (
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg font-semibold text-slate-900">{title}</DialogTitle>
              {description && (
                <p className="text-sm text-slate-600 mt-1">{description}</p>
              )}
            </DialogHeader>
          )}

          {children}

          {footer && (
            <DialogFooter className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-2">
              {footer}
            </DialogFooter>
          )}
        </div>
      </DialogOverlay>
    </DialogRoot>
  );
};
