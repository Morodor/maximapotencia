import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CURRENT_APP_VERSION, DEFAULT_APK_URL, startNativeUpdate } from '../../utils/updateManager';
import { 
  Rocket, 
  Download, 
  CheckCircle2, 
  X, 
  Sparkles, 
  AlertCircle,
  Smartphone,
  RefreshCw,
  Zap
} from 'lucide-react';

export const UpdateModal = ({ isOpen, onClose }) => {
  const { appUpdateInfo, showNotification } = useApp();
  const [isDownloading, setIsDownloading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadStats, setDownloadStats] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !appUpdateInfo) return null;

  const targetVersion = appUpdateInfo.latestVersion || '2.0.2';
  const downloadUrl = appUpdateInfo.downloadUrl || DEFAULT_APK_URL;

  const handleStartUpdate = async () => {
    setIsDownloading(true);
    setProgressPercent(0);
    setErrorMessage('');
    setStatusMessage('Conectando con el servidor...');

    const ok = await startNativeUpdate(
      downloadUrl,
      // Callback de progreso
      (data) => {
        if (data.percent !== undefined) {
          setProgressPercent(data.percent);
        }
        if (data.currentBytes && data.totalBytes) {
          const currentMb = (data.currentBytes / (1024 * 1024)).toFixed(1);
          const totalMb = (data.totalBytes / (1024 * 1024)).toFixed(1);
          setDownloadStats(`${currentMb} MB / ${totalMb} MB`);
        }
        if (data.percent === 100) {
          setStatusMessage('¡Descarga completa! Abriendo instalador de Android...');
        } else if (data.percent > 0) {
          setStatusMessage(`Descargando actualización (${data.percent}%)...`);
        }
      },
      // Callback de error
      (err) => {
        setIsDownloading(false);
        setErrorMessage(err);
        showNotification(err, true);
      }
    );

    if (!ok) {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 sm:p-8 space-y-6">
        
        {/* Glow de fondo decorativo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Botón cerrar */}
        {!isDownloading && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Cabecera */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-red-950/50 shrink-0">
            <Rocket className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                Actualización Inmediata
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Máxima Potencia v{targetVersion}
            </h3>
          </div>
        </div>

        {/* Comparativa de Versiones */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs">
          <div className="text-center p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Versión Instalada</span>
            <span className="text-sm font-mono font-bold text-slate-300">v{CURRENT_APP_VERSION}</span>
          </div>
          <div className="text-center p-2 rounded-xl bg-red-950/20 border border-red-900/40">
            <span className="text-[10px] text-red-400 uppercase font-bold block">Nueva Versión</span>
            <span className="text-sm font-mono font-bold text-emerald-400">v{targetVersion} ✨</span>
          </div>
        </div>

        {/* Novedades y Notas de la Versión */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Novedades en esta versión:</span>
          </span>
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto custom-scrollbar font-sans">
            {appUpdateInfo.releaseNotes || '• Modificación completa de sesiones existentes.\n• Actualización automática en 1 clic.\n• Optimización de márgenes para teléfonos móviles.'}
          </div>
        </div>

        {/* Proceso de Actualización con 1 Clic */}
        <div className="space-y-3 pt-2">
          {isDownloading ? (
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 animate-in fade-in">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="flex items-center gap-2 text-white">
                  <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
                  <span>{statusMessage || 'Descargando e instalando...'}</span>
                </span>
                <span className="text-emerald-400 font-mono text-sm">
                  {progressPercent >= 0 ? `${progressPercent}%` : ''}
                </span>
              </div>

              {/* Barra de progreso interactiva */}
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700 p-0.5">
                <div 
                  className="bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 h-full rounded-full transition-all duration-150"
                  style={{ width: `${Math.max(4, progressPercent)}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>{downloadStats || 'Descargando paquete oficial...'}</span>
                <span>Instalación automática</span>
              </div>

              <p className="text-[11px] text-amber-300/80 text-center italic pt-1">
                Apenas termine, la pantalla de Android te pedirá confirmar "Instalar". No cierres la app.
              </p>
            </div>
          ) : (
            <button
              onClick={handleStartUpdate}
              className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm py-4 px-6 rounded-2xl shadow-xl shadow-red-950/60 transition-all active:scale-98"
            >
              <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span>Actualizar Ahora (1 Clic)</span>
            </button>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/50 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
          <span>Publicado: {appUpdateInfo.releaseDate || 'Recientemente'}</span>
          {!isDownloading && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white font-semibold"
            >
              Posponer
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
