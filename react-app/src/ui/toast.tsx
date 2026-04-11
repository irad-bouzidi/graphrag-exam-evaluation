import * as React from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/utils/formatters';

export const showSuccess = (message: string) =>
  toast.success(message, {
    duration: 3000,
  });

export const showError = (message: string) =>
  toast.error(message, {
    duration: 5000,
  });

export const showInfo = (message: string) =>
  toast.info(message, {
    duration: 4000,
  });

export const showLoading = (message: string) =>
  toast.loading(message, {
    duration: Infinity,
  });

export const removeLoading = (toastId: string) =>
  toast.dismiss(toastId);

export const confirm = (message: string, accept: () => void, reject: () => void) =>
  toast.promise(
    new Promise<boolean>((resolve) => {
      const toastId = toast.promise(
        new Promise<boolean>((resolve) => {
          toast.loading(message, {
            duration: 10000,
          });
          const handleAccept = () => {
            toast.dismiss(toastId);
            accept();
            resolve(true);
          };
          const handleReject = () => {
            toast.dismiss(toastId);
            reject();
            resolve(false);
          };
          window.addEventListener('confirm-accept', handleAccept);
          window.addEventListener('confirm-reject', handleReject);
        })
      );
    }),
    {
      duration: 20000,
      description: 'Confirmer pour continuer',
    }
  );
