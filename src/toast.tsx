import React, { useState, useEffect } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warn';
  text: string;
  duration?: number;
}

type ToastListener = (toasts: ToastMessage[]) => void;

let toastsStack: ToastMessage[] = [];
let listeners: ToastListener[] = [];
const lastToastTime: Record<string, number> = {};

const notifyListeners = () => {
  listeners.forEach(l => l([...toastsStack]));
};

export const toast = {
  show: (text: string, type: 'success' | 'error' | 'info' | 'warn' = 'info', duration = 3500) => {
    const now = Date.now();
    // Deduplication: prevent identical toast messages within 1.5 seconds or currently active
    if (lastToastTime[text] && (now - lastToastTime[text] < 1500)) {
      return;
    }
    if (toastsStack.some(t => t.text === text)) {
      return;
    }

    lastToastTime[text] = now;
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, text, duration };
    
    toastsStack = [newToast, ...toastsStack]; // Newest on top
    notifyListeners();

    setTimeout(() => {
      toastsStack = toastsStack.filter(t => t.id !== id);
      notifyListeners();
    }, duration);
  },
  success: (text: string, _options?: any) => toast.show(text, 'success'),
  error: (text: string, _options?: any) => toast.show(text, 'error'),
  info: (text: string, _options?: any) => toast.show(text, 'info'),
  warn: (text: string, _options?: any) => toast.show(text, 'warn'),
};

export const ToastContainer: React.FC = () => {
  const [currentToasts, setCurrentToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler: ToastListener = (updated) => setCurrentToasts(updated);
    listeners.push(handler);
    return () => {
      listeners = listeners.filter(l => l !== handler);
    };
  }, []);

  if (currentToasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.65rem',
        pointerEvents: 'none',
        width: '90%',
        maxWidth: '520px'
      }}
    >
      {currentToasts.map(t => {
        const bg =
          t.type === 'success'
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : t.type === 'error'
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : t.type === 'warn'
            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';

        return (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              background: bg,
              color: '#ffffff',
              padding: '0.8rem 1.4rem',
              borderRadius: '16px',
              fontSize: '0.9rem',
              fontWeight: 600,
              boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.25), 0 10px 15px -5px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(12px)',
              textAlign: 'center',
              lineHeight: '1.45',
              animation: 'toastCenterSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}
          >
            {t.text}
          </div>
        );
      })}
    </div>
  );
};
