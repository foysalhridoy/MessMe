export interface PresetAvatar {
  id: string;
  name: string;
  gradient: string;
  iconText: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  { id: 'indigo', name: 'Indigo Aura', gradient: 'bg-gradient-to-tr from-indigo-500 to-indigo-700', iconText: 'M' },
  { id: 'slate', name: 'Slate Minimal', gradient: 'bg-gradient-to-tr from-slate-600 to-slate-800', iconText: 'S' },
  { id: 'violet', name: 'Violet Breeze', gradient: 'bg-gradient-to-tr from-purple-500 to-indigo-600', iconText: 'V' },
  { id: 'emerald', name: 'Emerald Calm', gradient: 'bg-gradient-to-tr from-emerald-500 to-teal-700', iconText: 'E' },
  { id: 'sky', name: 'Sky Clarity', gradient: 'bg-gradient-to-tr from-sky-400 to-blue-600', iconText: 'C' },
  { id: 'rose', name: 'Rose Petal', gradient: 'bg-gradient-to-tr from-rose-400 to-pink-600', iconText: 'R' },
  { id: 'amber', name: 'Amber Horizon', gradient: 'bg-gradient-to-tr from-amber-400 to-orange-600', iconText: 'A' },
  { id: 'teal', name: 'Teal Modern', gradient: 'bg-gradient-to-tr from-teal-400 to-cyan-600', iconText: 'T' },
];

/**
 * Returns a consistent gradient background based on a string seed (e.g. username)
 */
export function getAvatarGradient(seed: string): string {
  if (!seed) return PRESET_AVATARS[0].gradient;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PRESET_AVATARS.length;
  return PRESET_AVATARS[index].gradient;
}

/**
 * Resizes and compresses an uploaded image file to a lightweight data URL
 * (max 256x256, ~25KB) so it saves reliably to localStorage and transmits instantly across sessions.
 */
export async function compressAvatarImage(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale proportionally to fit within maxSize
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Resizes and compresses an uploaded chat image file to a lightweight data URL
 * (max 1280x1280, JPEG 82%, typically ~100-250KB)
 * so it saves reliably to localStorage and transmits instantly across sessions.
 */
export async function compressChatImage(file: File, maxDimension = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale proportionally to fit within maxDimension
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

