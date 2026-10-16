import React, { useState } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';

interface SearchInChatBarProps {
  onSearch: (query: string) => void;
  onClose: () => void;
  matchCount: number;
  currentMatchIndex: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
}

export const SearchInChatBar: React.FC<SearchInChatBarProps> = ({
  onSearch,
  onClose,
  matchCount,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
}) => {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        onPrevMatch();
      } else {
        onNextMatch();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200/80 animate-in slide-in-from-top-2 select-none">
      <div className="relative flex-1 max-w-md">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search this conversation..."
          className="w-full pl-8 pr-16 py-1.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
        />
        {query && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
            {matchCount > 0 ? `${currentMatchIndex + 1} of ${matchCount}` : '0 found'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        <button
          onClick={onPrevMatch}
          disabled={matchCount === 0}
          className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-200/50"
          title="Previous match"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={onNextMatch}
          disabled={matchCount === 0}
          className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-200/50"
          title="Next match"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/50 ml-1"
          title="Close search"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
