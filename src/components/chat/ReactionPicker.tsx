import { useState } from 'react';
import { Plus } from 'lucide-react';
import { QUICK_REACTIONS } from '../../lib/emojis';
import { EmojiPicker } from './EmojiPicker';

interface ReactionPickerProps {
  onSelectReaction: (emoji: string) => void;
  onClose?: () => void;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  onSelectReaction,
  onClose,
}) => {
  const [showFullPicker, setShowFullPicker] = useState(false);

  return (
    <div className="relative inline-flex items-center gap-1 p-1 bg-white rounded-full shadow-lg border border-slate-200/90 animate-in fade-in zoom-in-95 select-none z-30">
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => {
            onSelectReaction(emoji);
            if (onClose) onClose();
          }}
          className="w-7 h-7 flex items-center justify-center text-base hover:scale-125 hover:bg-slate-100 rounded-full transition-transform cursor-pointer"
        >
          {emoji}
        </button>
      ))}

      <button
        type="button"
        onClick={() => setShowFullPicker(!showFullPicker)}
        className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        title="More reactions"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {showFullPicker && (
        <EmojiPicker
          isOpen={showFullPicker}
          onSelect={(emoji) => {
            onSelectReaction(emoji);
            setShowFullPicker(false);
            if (onClose) onClose();
          }}
          onClose={() => setShowFullPicker(false)}
        />
      )}
    </div>
  );
};
