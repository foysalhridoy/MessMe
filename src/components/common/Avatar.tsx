import { useState } from 'react';
import { getAvatarGradient } from '../../lib/avatars';

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  seed?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
}

const SIZES: Record<NonNullable<AvatarProps['size']>, { px: number; textSize: string; statusSize: string }> = {
  xs: { px: 28, textSize: 'text-[11px]', statusSize: 'w-2 h-2 right-0 bottom-0 ring-1' },
  sm: { px: 36, textSize: 'text-xs font-semibold', statusSize: 'w-2.5 h-2.5 right-0 bottom-0 ring-2' },
  md: { px: 44, textSize: 'text-sm font-bold', statusSize: 'w-3 h-3 right-0.5 bottom-0.5 ring-2' },
  lg: { px: 52, textSize: 'text-base font-bold', statusSize: 'w-3.5 h-3.5 right-0.5 bottom-0.5 ring-2' },
  xl: { px: 88, textSize: 'text-2xl font-extrabold', statusSize: 'w-4 h-4 right-1 bottom-1 ring-2' },
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  seed,
  size = 'md',
  isOnline,
  className = '',
}) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const config = SIZES[size] || SIZES.md;
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const gradientClass = getAvatarGradient(seed || name);

  const hasValidPhoto = Boolean(avatarUrl && failedUrl !== avatarUrl);

  return (
    <div
      style={{
        width: `${config.px}px`,
        height: `${config.px}px`,
        minWidth: `${config.px}px`,
        minHeight: `${config.px}px`,
        maxWidth: `${config.px}px`,
        maxHeight: `${config.px}px`,
      }}
      className={`relative inline-flex flex-shrink-0 items-center justify-center rounded-full ${className}`}
    >
      {hasValidPhoto ? (
        <img
          src={avatarUrl}
          alt={name}
          onError={() => setFailedUrl(avatarUrl || null)}
          style={{
            width: `${config.px}px`,
            height: `${config.px}px`,
            minWidth: `${config.px}px`,
            minHeight: `${config.px}px`,
            maxWidth: `${config.px}px`,
            maxHeight: `${config.px}px`,
          }}
          className="rounded-full object-cover border border-slate-200/90 shadow-sm flex-shrink-0 block"
        />
      ) : (
        <div
          style={{
            width: `${config.px}px`,
            height: `${config.px}px`,
            minWidth: `${config.px}px`,
            minHeight: `${config.px}px`,
            maxWidth: `${config.px}px`,
            maxHeight: `${config.px}px`,
          }}
          className={`${config.textSize} ${gradientClass} rounded-full text-white flex items-center justify-center shadow-sm select-none tracking-tight flex-shrink-0`}
        >
          {initial}
        </div>
      )}

      {isOnline !== undefined && (
        <span
          className={`absolute rounded-full ring-2 ring-white shadow-xs ${config.statusSize} ${
            isOnline ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
          title={isOnline ? 'Active Online' : 'Offline'}
        />
      )}
    </div>
  );
};
