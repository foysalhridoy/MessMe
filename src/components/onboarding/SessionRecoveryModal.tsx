import { useState } from 'react';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useChat } from '../../context/ChatContext';

interface SessionRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionRecoveryModal: React.FC<SessionRecoveryModalProps> = ({ isOpen, onClose }) => {
  const { restoreSessionWithToken } = useChat();
  const [username, setUsername] = useState('');
  const [sessionKey, setSessionKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !sessionKey.trim()) return;

    setIsSubmitting(true);
    try {
      const ok = await restoreSessionWithToken(sessionKey.trim(), username.trim().toLowerCase());
      if (ok) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Restore Session"
      description="MessMe uses cryptographic local sessions instead of passwords."
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <strong className="text-slate-800">Security Note:</strong> Usernames in MessMe are public,
            not passwords. Knowing someone&apos;s username cannot grant access to their account or conversations.
            Only the corresponding session key restores identity.
          </div>
        </div>

        <form onSubmit={handleRestore} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Your Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                placeholder="username"
                className="w-full pl-7 pr-3 py-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Session Backup Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={sessionKey}
                onChange={(e) => setSessionKey(e.target.value.trim())}
                placeholder="mm_tok_..."
                className="w-full px-3 py-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              The 64-character token exported from your profile settings on this or another device.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Restore Identity
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
