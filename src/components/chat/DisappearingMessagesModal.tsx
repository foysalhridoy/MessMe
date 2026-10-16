import React from 'react';
import { Timer, Check, Sparkles, HardDrive } from 'lucide-react';
import { Modal } from '../common/Modal';
import type { DisappearingDuration } from '../../types';
import { useChat } from '../../context/ChatContext';

interface DisappearingMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DisappearingMessagesModal: React.FC<DisappearingMessagesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeConversation, setDisappearingDuration, purgeStorageNow } = useChat();

  if (!activeConversation) return null;

  const currentDuration: DisappearingDuration = activeConversation.disappearingDuration || 'off';

  const handleSelect = async (duration: DisappearingDuration) => {
    await setDisappearingDuration(activeConversation.id, duration);
    onClose();
  };

  const handlePurgeNow = async () => {
    await purgeStorageNow(activeConversation.id);
  };

  const options: { id: DisappearingDuration; label: string; desc: string; badge?: string }[] = [
    {
      id: '24h',
      label: '24 Hours',
      desc: 'Messages automatically vanish 24 hours after being sent. Maximum storage savings.',
      badge: 'Recommended',
    },
    {
      id: '48h',
      label: '48 Hours',
      desc: 'Messages stay for 2 days before being permanently deleted from storage.',
    },
    {
      id: 'off',
      label: 'Off',
      desc: 'Keep messages in this conversation forever until manually cleared.',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Disappearing Messages"
      description={`Manage automatic message deletion for your chat with @${activeConversation.otherParticipant.username}.`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Info card */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-indigo-600/20">
            <Timer className="w-4 h-4" />
          </div>
          <div className="text-xs text-indigo-950 leading-relaxed">
            <p className="font-bold text-indigo-900">Storage Optimization & Privacy</p>
            <p className="text-indigo-700/90 mt-0.5">
              Auto-disappearing messages keep your device storage light and clean by deleting older media and texts.
            </p>
          </div>
        </div>

        {/* Duration selection options */}
        <div className="space-y-2">
          {options.map((opt) => {
            const isSelected = currentDuration === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-indigo-50/90 border-indigo-400/90 shadow-sm ring-1 ring-indigo-400'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{opt.label}</span>
                    {opt.badge && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <Sparkles className="w-2.5 h-2.5" />
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-normal">{opt.desc}</p>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Storage Purge Action */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePurgeNow}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 font-semibold cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>Check &amp; Purge Expired Now</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
