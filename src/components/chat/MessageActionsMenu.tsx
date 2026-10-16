import { useState } from 'react';
import { Smile, Reply, Copy, Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import type { Message } from '../../types';
import { ReactionPicker } from './ReactionPicker';
import { useChat } from '../../context/ChatContext';

interface MessageActionsMenuProps {
  message: Message;
  isSender: boolean;
  onStartEdit: () => void;
}

export const MessageActionsMenu: React.FC<MessageActionsMenuProps> = ({
  message,
  isSender,
  onStartEdit,
}) => {
  const { reactToMessage, startReply, deleteUserMessage, showToast } = useChat();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  if (message.isDeleted) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    showToast('Message copied to clipboard', 'info');
    setShowMoreMenu(false);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this message?')) {
      deleteUserMessage(message.id);
    }
    setShowMoreMenu(false);
  };

  return (
    <div className="relative inline-flex items-center gap-0.5 bg-white/95 backdrop-blur-sm rounded-full shadow-sm border border-slate-200/90 p-0.5 select-none">
      {/* React button */}
      <button
        type="button"
        onClick={() => setShowReactionPicker(!showReactionPicker)}
        className="p-1 text-slate-400 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        title="Add reaction"
      >
        <Smile className="w-3.5 h-3.5" />
      </button>

      {/* Reply button */}
      <button
        type="button"
        onClick={() => startReply(message)}
        className="p-1 text-slate-400 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        title="Reply"
      >
        <Reply className="w-3.5 h-3.5" />
      </button>

      {/* More actions (copy, edit, delete) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          title="More actions"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>

        {showMoreMenu && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowMoreMenu(false)} />
            <div
              className={`absolute top-6 ${
                isSender ? 'right-0' : 'left-0'
              } z-40 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 text-xs text-slate-700 animate-in fade-in zoom-in-95`}
            >
              <button
                type="button"
                onClick={handleCopy}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                Copy Text
              </button>

              {isSender && message.type === 'text' && (
                <button
                  type="button"
                  onClick={() => {
                    onStartEdit();
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  Edit
                </button>
              )}

              {isSender && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating Reaction Picker */}
      {showReactionPicker && (
        <div
          className={`absolute bottom-7 ${
            isSender ? 'right-0' : 'left-0'
          } z-50`}
        >
          <ReactionPicker
            onSelectReaction={(emoji) => {
              reactToMessage(message.id, emoji);
              setShowReactionPicker(false);
            }}
            onClose={() => setShowReactionPicker(false)}
          />
        </div>
      )}
    </div>
  );
};
