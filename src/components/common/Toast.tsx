import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { ToastMessage } from '../../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-600 flex-shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-200/80',
    error: 'border-rose-200/80',
    warning: 'border-amber-200/80',
    info: 'border-indigo-200/80',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 bg-white rounded-xl shadow-lg border ${
            borders[toast.type || 'info']
          } transition-all transform animate-in slide-in-from-bottom-3 duration-200`}
        >
          {icons[toast.type || 'info']}
          <div className="flex-1 min-w-0 pt-0.5">
            {toast.title && (
              <h4 className="text-xs font-semibold text-slate-900 tracking-tight">{toast.title}</h4>
            )}
            <p className="text-xs text-slate-600 leading-relaxed break-words">{toast.message}</p>
          </div>
          <button
            onClick={() => onRemove(toast.id)}
            className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 rounded-md hover:bg-slate-50 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
