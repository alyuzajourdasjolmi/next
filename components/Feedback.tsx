"use client";

import React, { useEffect, useRef } from 'react';
import {
  CheckCircle, XCircle, AlertTriangle, Info, X,
  Check, Loader2,
} from 'lucide-react';
import { useFeedback, Toast, DialogState } from '../lib/feedback-context';

const TOAST_ICONS = {
  success: <Check size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
  warning: <AlertTriangle size={18} />,
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [dismissing, setDismissing] = React.useState(false);

  const handleClose = () => {
    setDismissing(true);
    setTimeout(() => onDismiss(toast.id), 250);
  };

  return (
    <div className={`fb-toast ${toast.type} ${dismissing ? 'dismissing' : ''}`}>
      <div className={`fb-toast-icon ${toast.type}`}>{TOAST_ICONS[toast.type]}</div>
      <div className="fb-toast-body">
        <h4 className="fb-toast-title">{toast.title}</h4>
        {toast.description && <p className="fb-toast-desc">{toast.description}</p>}
      </div>
      <button className="fb-toast-close" onClick={handleClose} aria-label="Tutup">
        <X size={14} />
      </button>
      <div
        className="fb-toast-progress"
        style={{ animationDuration: `${toast.duration}ms` }}
      />
    </div>
  );
}

function CheckmarkIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 52 52" fill="none" className="fb-checkmark">
      <circle
        cx="26" cy="26" r="24"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="2.5"
        style={{ strokeDasharray: 151, strokeDashoffset: 0 }}
      />
      <path
        d="M14 27 L22 35 L38 18"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{ strokeDasharray: 38, strokeDashoffset: 0 }}
      />
    </svg>
  );
}

function SuccessDialogContent({
  state,
  onClose,
}: {
  state: Extract<DialogState, { type: 'success' }>;
  onClose: () => void;
}) {
  const handleClose = () => {
    state.onClose?.();
    onClose();
  };

  return (
    <>
      <div className="fb-icon-wrap success">
        <CheckmarkIcon />
      </div>
      <h3 className="fb-title">{state.title}</h3>
      {state.description && <p className="fb-desc">{state.description}</p>}
      <div className="fb-actions">
        <button className="fb-btn primary" onClick={handleClose} autoFocus>
          <Check size={15} /> {state.buttonText || 'OK'}
        </button>
      </div>
    </>
  );
}

function ErrorDialogContent({
  state,
  onClose,
}: {
  state: Extract<DialogState, { type: 'error' }>;
  onClose: () => void;
}) {
  const handleClose = () => {
    state.onClose?.();
    onClose();
  };

  return (
    <>
      <div className="fb-icon-wrap error">
        <XCircle size={38} strokeWidth={2.2} />
      </div>
      <h3 className="fb-title">{state.title}</h3>
      {state.description && <p className="fb-desc">{state.description}</p>}
      <div className="fb-actions">
        <button className="fb-btn primary" onClick={handleClose} autoFocus>
          {state.buttonText || 'Tutup'}
        </button>
      </div>
    </>
  );
}

function ConfirmDialogContent({
  state,
  onClose,
}: {
  state: Extract<DialogState, { type: 'confirm' }>;
  onClose: () => void;
}) {
  const isDanger = state.variant === 'danger';

  const handleConfirm = () => {
    state.onConfirm();
    onClose();
  };

  const handleCancel = () => {
    state.onCancel?.();
    onClose();
  };

  return (
    <>
      <div className={`fb-icon-wrap ${isDanger ? 'confirm-danger' : 'confirm-default'}`}>
        <AlertTriangle size={34} strokeWidth={2.2} />
      </div>
      <h3 className="fb-title">{state.title}</h3>
      {state.description && <p className="fb-desc">{state.description}</p>}
      <div className="fb-actions">
        <button className="fb-btn ghost" onClick={handleCancel}>
          {state.cancelText || 'Batal'}
        </button>
        <button
          className={`fb-btn ${isDanger ? 'danger' : 'primary'}`}
          onClick={handleConfirm}
          autoFocus
        >
          {state.confirmText || 'Ya, Lanjutkan'}
        </button>
      </div>
    </>
  );
}

function DialogHost() {
  const { dialog, closeDialog } = useFeedback();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dialog.type === 'confirm') {
          // For confirm, treat Escape as cancel
          if ('onCancel' in dialog) dialog.onCancel?.();
        }
        closeDialog();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, closeDialog]);

  if (!dialog) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      if (dialog.type === 'confirm' && 'onCancel' in dialog) {
        dialog.onCancel?.();
      }
      closeDialog();
    }
  };

  return (
    <div className="fb-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="fb-dialog" role="dialog" aria-modal="true">
        {dialog.type === 'success' && <SuccessDialogContent state={dialog} onClose={closeDialog} />}
        {dialog.type === 'error' && <ErrorDialogContent state={dialog} onClose={closeDialog} />}
        {dialog.type === 'confirm' && <ConfirmDialogContent state={dialog} onClose={closeDialog} />}
      </div>
    </div>
  );
}

function ToastHost() {
  const { toasts, dismissToast } = useFeedback();
  return (
    <div className="fb-toast-container" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  );
}

export default function FeedbackHost() {
  return (
    <>
      <DialogHost />
      <ToastHost />
    </>
  );
}

export { Loader2 };
