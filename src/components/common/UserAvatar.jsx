import React, { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';

export const AVATAR_PRESETS = [
  { id: 'weightlifter', emoji: '🏋️', label: 'Halterofilia', gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
  { id: 'power',        emoji: '⚡',  label: 'Potencia VBT', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { id: 'crown',        emoji: '👑',  label: 'Élite Pro',    gradient: 'linear-gradient(135deg, #eab308, #a16207)' },
  { id: 'fire',         emoji: '🔥',  label: 'Fuego',        gradient: 'linear-gradient(135deg, #f97316, #dc2626)' },
  { id: 'lion',         emoji: '🦁',  label: 'León',         gradient: 'linear-gradient(135deg, #d97706, #92400e)' },
  { id: 'eagle',        emoji: '🦅',  label: 'Águila',       gradient: 'linear-gradient(135deg, #2563eb, #1e40af)' },
  { id: 'bionic',       emoji: '🦾',  label: 'Fuerza Pura',  gradient: 'linear-gradient(135deg, #475569, #1e293b)' },
  { id: 'trophy',       emoji: '🏆',  label: 'Campeón',      gradient: 'linear-gradient(135deg, #10b981, #047857)' },
  { id: 'target',       emoji: '🎯',  label: 'Precisión',    gradient: 'linear-gradient(135deg, #06b6d4, #0e7490)' },
  { id: 'wolf',         emoji: '🐺',  label: 'Lobo',         gradient: 'linear-gradient(135deg, #8b5cf6, #5b21b6)' }
];

export const PROFILE_COLORS = [
  '#ef4444',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#f97316'
];

export const PROFILE_SPECIALTIES = [
  'Halterofilia / DLP',
  'Fuerza & Powerlifting',
  'Potencia & VBT',
  'Preparación Física General',
  'CrossFit / Funcional',
  'Kinesiología & Rehab',
  'Atleta Competitivo'
];

export const compressImageToBase64 = (file, maxSize = 220, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas no disponible.'));
          return;
        }

        const minSide = Math.min(img.width, img.height);
        const sx = Math.max(0, (img.width - minSide) / 2);
        const sy = Math.max(0, (img.height - minSide) / 2);

        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxSize, maxSize);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const SIZE_CLASSES = {
  xs: { box: 'w-7 h-7 text-[11px] rounded-lg', emoji: 'text-sm', crown: 'w-3.5 h-3.5 -top-1 -right-1', crownIcon: 'w-2 h-2' },
  sm: { box: 'w-8 h-8 text-xs rounded-xl', emoji: 'text-base', crown: 'w-3.5 h-3.5 -top-1 -right-1', crownIcon: 'w-2 h-2' },
  md: { box: 'w-10 h-10 text-sm rounded-xl', emoji: 'text-lg', crown: 'w-4 h-4 -top-1 -right-1', crownIcon: 'w-2.5 h-2.5' },
  lg: { box: 'w-12 h-12 text-base rounded-2xl', emoji: 'text-xl', crown: 'w-5 h-5 -top-1.5 -right-1.5', crownIcon: 'w-3 h-3' },
  xl: { box: 'w-20 h-20 text-2xl rounded-3xl', emoji: 'text-4xl', crown: 'w-6 h-6 -top-1.5 -right-1.5', crownIcon: 'w-3.5 h-3.5' }
};

export const UserAvatar = ({
  profile = null,
  name = '',
  email = '',
  color = '',
  size = 'md',
  showCrown = false,
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);

  const photoSrc = profile?.avatarUrl || profile?.photoURL || profile?.photoUrl || '';
  useEffect(() => {
    setImgError(false);
  }, [photoSrc, profile?.avatarType]);

  const sizeCfg = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const displayName = name || profile?.displayName || profile?.name || email || 'US';
  const initials = displayName
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'US';

  const bgColor = color || profile?.color || '#3b82f6';
  const preset = profile?.avatarType === 'preset' && profile?.avatarPreset
    ? AVATAR_PRESETS.find(p => p.id === profile.avatarPreset)
    : null;
  const usePhoto = (profile?.avatarType === 'photo' || !profile?.avatarType) && Boolean(photoSrc) && !imgError;

  return (
    <div
      className={`relative inline-flex items-center justify-center font-black text-white shrink-0 shadow-md border border-white/15 select-none ${sizeCfg.box} ${className}`}
      style={{
        background: preset ? preset.gradient : bgColor
      }}
    >
      {preset ? (
        <span className={`${sizeCfg.emoji} leading-none`} role="img" aria-label={preset.label}>
          {preset.emoji}
        </span>
      ) : usePhoto ? (
        <img
          src={photoSrc}
          alt={displayName}
          className="w-full h-full object-cover rounded-[inherit]"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}

      {showCrown && (
        <span
          className={`absolute ${sizeCfg.crown} bg-amber-400 text-slate-950 rounded-full flex items-center justify-center shadow border border-slate-900/40 z-10`}
        >
          <Crown className={`${sizeCfg.crownIcon} fill-slate-950`} />
        </span>
      )}
    </div>
  );
};
