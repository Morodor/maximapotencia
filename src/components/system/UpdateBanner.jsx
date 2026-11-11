import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Rocket, X, ArrowRight, Sparkles } from 'lucide-react';

export const UpdateBanner = () => {
  const { hasUpdateAvailable, appUpdateInfo, setIsUpdateModalOpen } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (appUpdateInfo?.latestVersion) {
      const dismissed = sessionStorage.getItem(`dismissed_update_${appUpdateInfo.latestVersion}`);
      if (dismissed === 'true') {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    }
  }, [appUpdateInfo?.latestVersion]);

  if (!hasUpdateAvailable || isDismissed || !appUpdateInfo) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    if (appUpdateInfo?.latestVersion) {
      sessionStorage.setItem(`dismissed_update_${appUpdateInfo.latestVersion}`, 'true');
    }
  };

  return (
    <div className="mb-4 bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/80 border border-red-500/30 p-3 sm:p-3.5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-950/40">
          <Rocket className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
            <span>¡Nueva versión v{appUpdateInfo.latestVersion} disponible!</span>
            <span className="hidden sm:inline-flex text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-1.5 py-0.2 rounded-md">
              Oficial
            </span>
          </p>
          <p className="text-[11px] text-slate-400 truncate">
            {appUpdateInfo.releaseNotes?.split('\n')[0] || 'Mejoras en visualización móvil y estabilidad.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-end">
        <button
          onClick={() => setIsUpdateModalOpen(true)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md shadow-red-950/30 transition-all active:scale-95"
        >
          <span>Actualizar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Ocultar por ahora"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
