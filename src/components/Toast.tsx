import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
}

let toastIdCounter = 0;
const listeners: ((toast: ToastData) => void)[] = [];

export function showToast(message: string, type: ToastType = 'error') {
  const toast: ToastData = { id: `toast-${++toastIdCounter}`, type, message };
  listeners.forEach((fn) => fn(toast));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const listener = (toast: ToastData) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 5000);
    };
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = toast.type === 'error' ? AlertCircle : toast.type === 'success' ? CheckCircle : Info;
        const styles = {
          error: 'bg-red-50 border-red-200 text-red-800',
          success: 'bg-green-50 border-green-200 text-green-800',
          info: 'bg-blue-50 border-blue-200 text-blue-800',
        };
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg pointer-events-auto animate-in ${styles[toast.type]}`}
          >
            <Icon size={18} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm flex-1 leading-relaxed">{toast.message}</p>
            <button onClick={() => dismiss(toast.id)} className="flex-shrink-0 opacity-60 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
