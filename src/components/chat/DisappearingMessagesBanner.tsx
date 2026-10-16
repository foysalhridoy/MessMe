import React, { useState, useEffect } from 'react';
import { Timer, ChevronRight } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { DisappearingMessagesModal } from './DisappearingMessagesModal';

export const DisappearingMessagesBanner: React.FC = () => {
  const { activeConversation, activeMessages } = useChat();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeRemainingText, setTimeRemainingText] = useState<string>('');

  const duration = activeConversation?.disappearingDuration || 'off';

  // Compute countdown to next message expiration
  useEffect(() => {
    if (!activeConversation || duration === 'off') {
      setTimeRemainingText('');
      return;
    }

    const calculateTimeLeft = () => {
      const durationHours = duration === '24h' ? 24 : 48;
      const durationMs = durationHours * 3600 * 1000;
      const now = Date.now();

      // Find the oldest message that hasn't expired yet
      const validMessages = activeMessages.filter((m) => !m.isDeleted);
      if (validMessages.length === 0) {
        setTimeRemainingText(`Auto-deletes messages after ${durationHours} hours to save storage`);
        return;
      }

      // Oldest message is at index 0 (or find minimum createdAt)
      const oldestMsg = validMessages[0];
      const expiryTimestamp = oldestMsg.expiresAt
        ? new Date(oldestMsg.expiresAt).getTime()
        : new Date(oldestMsg.createdAt).getTime() + durationMs;

      const msLeft = expiryTimestamp - now;

      if (msLeft <= 0) {
        setTimeRemainingText('Expired messages will be cleared shortly');
      } else {
        const hoursLeft = Math.floor(msLeft / (3600 * 1000));
        const minsLeft = Math.floor((msLeft % (3600 * 1000)) / (60 * 1000));

        if (hoursLeft > 0) {
          setTimeRemainingText(`${hoursLeft}h ${minsLeft}m left before oldest message vanishes`);
        } else {
          setTimeRemainingText(`${Math.max(1, minsLeft)}m left before oldest message vanishes`);
        }
      }
    };

    calculateTimeLeft();
    const interval = window.setInterval(calculateTimeLeft, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [activeConversation?.id, duration, activeMessages]);

  if (!activeConversation || duration === 'off') {
    return (
      <DisappearingMessagesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    );
  }

  return (
    <>
      <div className="px-3 sm:px-6 md:px-10 pt-2 pb-1 bg-transparent select-none z-10 animate-in fade-in">
        <div
          onClick={() => setIsModalOpen(true)}
          className="mx-auto max-w-xl flex items-center justify-between gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-indigo-50/90 hover:bg-indigo-100/80 border border-indigo-200/80 text-indigo-950 transition-all cursor-pointer shadow-xs group"
          title="Click to change disappearing messages duration"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Timer className="w-3.5 h-3.5" />
            </span>

            <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] sm:text-xs font-bold text-indigo-900 tracking-tight flex items-center gap-1">
                <span>{duration.toUpperCase()} Disappearing:</span>
              </span>
              <span className="text-[11px] sm:text-xs text-indigo-700 font-medium truncate">
                {timeRemainingText}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 pl-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-indigo-600 group-hover:text-indigo-800 transition-colors hidden xs:inline">
              Change
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>

      <DisappearingMessagesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
