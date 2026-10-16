import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Light backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/25 backdrop-blur-[2px] transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal card */}
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] sm:max-h-[92vh] overflow-y-auto overflow-x-hidden no-scrollbar bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 transform transition-all z-10 p-0.5 sm:p-1`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {(title || description) && (
          <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
            <div>
              {title && <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">{title}</h3>}
              {description && <p className="text-xs sm:text-sm text-slate-500 mt-1">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="p-4 sm:p-6 pb-6 sm:pb-7">{children}</div>
      </div>
    </div>
  );
};
