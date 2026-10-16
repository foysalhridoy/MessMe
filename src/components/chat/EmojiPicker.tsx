import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { EMOJI_CATEGORIES, EMOJI_LIST } from '../../lib/emojis';
import type { EmojiData } from '../../types';

interface EmojiPickerProps {
  isOpen: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  isOpen,
  onSelect,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<EmojiData['category']>('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredEmojis = searchQuery.trim()
    ? EMOJI_LIST.filter(
        (e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          e.emoji.includes(searchQuery.trim())
      )
    : EMOJI_LIST.filter((e) => e.category === activeCategory);

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-16 sm:bottom-18 left-1 sm:left-4 z-50 w-[calc(100vw-2rem)] max-w-[19.5rem] sm:max-w-[21rem] bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 select-none"
    >
      {/* Search Header */}
      <div className="p-2.5 border-b border-slate-100 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emoji..."
            className="w-full pl-7 pr-7 py-1.5 bg-slate-50 focus:bg-white rounded-lg border border-slate-200/80 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs (only when not searching) */}
      {!searchQuery && (
        <div className="flex items-center justify-between px-2 pt-2 pb-1 border-b border-slate-100/80 bg-slate-50/50">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`p-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-indigo-100/70 scale-105'
                  : 'hover:bg-slate-100 text-slate-400'
              }`}
              title={cat.label}
              aria-label={cat.label}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="p-2 h-56 overflow-y-auto grid grid-cols-7 gap-1">
        {filteredEmojis.map((e, idx) => (
          <button
            key={`${e.emoji}-${idx}`}
            onClick={() => {
              onSelect(e.emoji);
            }}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded-lg transition-transform hover:scale-125 cursor-pointer"
            title={e.name}
          >
            {e.emoji}
          </button>
        ))}

        {filteredEmojis.length === 0 && (
          <div className="col-span-7 py-8 text-center text-xs text-slate-400">
            No emojis match &quot;{searchQuery}&quot;
          </div>
        )}
      </div>
    </div>
  );
};
