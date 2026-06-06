"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type Toast = {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
};

export type DialogState =
  | { type: 'success'; title: string; description?: string; buttonText?: string; onClose?: () => void }
  | { type: 'error'; title: string; description?: string; buttonText?: string; onClose?: () => void }
  | { type: 'confirm'; title: string; description?: string; confirmText?: string; cancelText?: string; variant?: 'danger' | 'default'; onConfirm: () => void; onCancel?: () => void }
  | null;

type FeedbackContextValue = {
  // Toasts
  toasts: Toast[];
  toast: (t: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  dismissToast: (id: number) => void;
  // Dialogs
  dialog: DialogState;
  showSuccess: (opts: { title: string; description?: string; buttonText?: string; onClose?: () => void }) => void;
  showError: (opts: { title: string; description?: string; buttonText?: string; onClose?: () => void }) => void;
  showConfirm: (opts: {
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'default';
    onConfirm: () => void;
    onCancel?: () => void;
  }) => void;
  closeDialog: () => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<DialogState>(null);
  const counterRef = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => {
      const id = ++counterRef.current;
      const duration = t.duration ?? 3200;
      setToasts((prev) => [...prev, { ...t, id, duration }]);
      setTimeout(() => dismissToast(id), duration);
    },
    [dismissToast]
  );

  const success = useCallback((title: string, description?: string) => {
    toast({ type: 'success', title, description });
  }, [toast]);

  const error = useCallback((title: string, description?: string) => {
    toast({ type: 'error', title, description });
  }, [toast]);

  const info = useCallback((title: string, description?: string) => {
    toast({ type: 'info', title, description });
  }, [toast]);

  const warning = useCallback((title: string, description?: string) => {
    toast({ type: 'warning', title, description });
  }, [toast]);

  const showSuccess = useCallback(
    (opts: { title: string; description?: string; buttonText?: string; onClose?: () => void }) => {
      setDialog({ type: 'success', ...opts });
    },
    []
  );

  const showError = useCallback(
    (opts: { title: string; description?: string; buttonText?: string; onClose?: () => void }) => {
      setDialog({ type: 'error', ...opts });
    },
    []
  );

  const showConfirm = useCallback(
    (opts: {
      title: string;
      description?: string;
      confirmText?: string;
      cancelText?: string;
      variant?: 'danger' | 'default';
      onConfirm: () => void;
      onCancel?: () => void;
    }) => {
      setDialog({ type: 'confirm', ...opts });
    },
    []
  );

  const closeDialog = useCallback(() => setDialog(null), []);

  return (
    <FeedbackContext.Provider
      value={{
        toasts, toast, success, error, info, warning, dismissToast,
        dialog, showSuccess, showError, showConfirm, closeDialog,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used within FeedbackProvider');
  return ctx;
}
