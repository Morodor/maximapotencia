import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Megaphone, 
  Trophy, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Sparkles,
  Calendar,
  ChevronRight
} from 'lucide-react';

export const AnnouncementBanner = () => {
  const { appUpdateInfo } = useApp();
  const announcement = appUpdateInfo?.announcement;
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (announcement?.active && announcement?.id) {
      const dismissed = sessionStorage.getItem(`dismissed_announcement_${announcement.id}`);
      if (dismissed === 'true') {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    }
  }, [announcement?.id, announcement?.active]);

  if (!announcement || !announcement.active || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    if (announcement.id) {
      sessionStorage.setItem(`dismissed_announcement_${announcement.id}`, 'true');
    }
  };

  const getStyle = () => {
    switch (announcement.type) {
      case 'trophy':
        return {
          gradient: 'from-amber-950/80 via-slate-900 to-amber-900/60',
          border: 'border-amber-500/40',
          iconBg: 'bg-amber-500 text-slate-950',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          badgeText: 'Competencia / Evento',
          Icon: Trophy
        };
      case 'alert':
        return {
          gradient: 'from-red-950/80 via-slate-900 to-red-900/60',
          border: 'border-red-500/40',
          iconBg: 'bg-red-600 text-white',
          badge: 'bg-red-500/20 text-red-300 border-red-500/40',
          badgeText: 'Aviso Importante',
          Icon: AlertTriangle
        };
      case 'success':
        return {
          gradient: 'from-emerald-950/80 via-slate-900 to-emerald-900/60',
          border: 'border-emerald-500/40',
          iconBg: 'bg-emerald-500 text-slate-950',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          badgeText: 'Comunidad',
          Icon: CheckCircle2
        };
      case 'info':
      default:
        return {
          gradient: 'from-blue-950/80 via-slate-900 to-cyan-950/60',
          border: 'border-cyan-500/40',
          iconBg: 'bg-cyan-500 text-slate-950',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          badgeText: 'Comunicado Oficial',
          Icon: Megaphone
        };
    }
  };

  const { gradient, border, iconBg, badge, badgeText, Icon } = getStyle();

  return (
    <div className={`mb-4 bg-gradient-to-r ${gradient} border ${border} p-3 sm:p-4 rounded-2xl shadow-xl flex items-start justify-between gap-3 animate-in slide-in-from-top-2 duration-200`}>
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0 shadow-md mt-0.5 font-bold`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border tracking-wider ${badge}`}>
              {badgeText}
            </span>
            {announcement.date && (
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {announcement.date}
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-white leading-snug">
            {announcement.title || 'Comunicado del Gimnasio'}
          </h4>
          <p className="text-xs text-slate-300 mt-0.5 whitespace-pre-line leading-relaxed">
            {announcement.message}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors shrink-0"
        title="Ocultar aviso"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
