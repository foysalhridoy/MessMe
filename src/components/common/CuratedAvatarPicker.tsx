import { useState } from 'react';
import { CARTOON_AVATARS, type CartoonAvatar } from '../../lib/cartoonAvatars';
import { Sparkles, Check } from 'lucide-react';

interface CuratedAvatarPickerProps {
  selectedAvatarUrl?: string;
  onSelectAvatar: (dataUri: string) => void;
  className?: string;
}

export const CuratedAvatarPicker: React.FC<CuratedAvatarPickerProps> = ({
  selectedAvatarUrl,
  onSelectAvatar,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'characters' | 'animals' | 'fantasy'>('all');

  const filteredAvatars =
    activeTab === 'all'
      ? CARTOON_AVATARS
      : CARTOON_AVATARS.filter((av) => av.category === activeTab);

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Header and Category Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Pick a Curated Cartoon Avatar
          </span>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'characters', label: 'People' },
              { id: 'animals', label: 'Animals' },
              { id: 'fantasy', label: 'Fantasy' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer select-none flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cartoon Faces Grid */}
      <div className="p-2 sm:p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl max-h-[175px] sm:max-h-[190px] overflow-y-auto overscroll-contain">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
          {filteredAvatars.map((av: CartoonAvatar) => {
            const isSelected = selectedAvatarUrl === av.dataUri;
            return (
              <button
                key={av.id}
                type="button"
                onClick={() => onSelectAvatar(av.dataUri)}
                title={av.name}
                className={`relative group flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer bg-white border ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-600/30 shadow-md scale-105'
                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-sm hover:scale-105'
                }`}
              >
                <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden flex-shrink-0">
                  <img
                    src={av.dataUri}
                    alt={av.name}
                    className="w-full h-full object-cover select-none pointer-events-none"
                    loading="lazy"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-medium text-slate-700 truncate w-full text-center mt-1 leading-tight block">
                  {av.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
