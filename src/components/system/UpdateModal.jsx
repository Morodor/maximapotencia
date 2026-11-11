import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CURRENT_APP_VERSION, downloadAndInstallUpdate } from '../../utils/updateManager';
import { 
  Rocket, 
  Download, 
  CheckCircle2, 
  X, 
  Sparkles, 
  ExternalLink, 
  AlertCircle,
  HelpCircle,
  Smartphone
} from 'lucide-react';

export const UpdateModal = ({ isOpen, onClose }) => {
  const { appUpdateInfo, showNotification } = useApp();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (!isOpen || !appUpdateInfo) return null;

  const targetVersion = appUpdateInfo.latestVersion || '2.0.2';
  const downloadUrl = appUpdateInfo.downloadUrl;

  const handleDownload = async () => {
    if (!downloadUrl) {
      showNotification('Aún no se ha configurado el enlace de descarga directa del APK.', true);
      return;
    }

    setIsDownloading(true);
    setDownloadStarted(true);

    const ok = await downloadAndInstallUpdate(downloadUrl);
    setIsDownloading(false);

    if (ok) {
      showNotification('Descarga iniciada en tu navegador/notificaciones.');
    } else {
      showNotification('No se pudo abrir el enlace de descarga automáticamente.', true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 sm:p-8 space-y-6">
        
        {/* Glow de fondo decorativo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabecera */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-red-950/50 shrink-0">
            <Rocket className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                Nueva Versión Disponible
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
            <span>Novedades en esta actualización:</span>
          </span>
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto custom-scrollbar font-sans">
            {appUpdateInfo.releaseNotes || '• Mejoras en estabilidad y rendimiento.\n• Corrección de errores y optimización para pantallas móviles.'}
          </div>
        </div>

        {/* Botón de Descarga / Instalación */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleDownload}
            disabled={isDownloading || !downloadUrl}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-extrabold text-sm py-3.5 px-6 rounded-2xl shadow-xl shadow-red-950/50 transition-all active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Descargando APK...' : `Descargar e Instalar v${targetVersion}`}</span>
          </button>

          {!downloadUrl && (
            <p className="text-[11px] text-amber-400/90 text-center flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>El Head Coach aún no ha publicado el enlace directo de esta versión.</span>
            </p>
          )}

          {downloadStarted && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300 space-y-1.5 animate-in fade-in">
              <p className="font-bold flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>¿Cómo instalar la actualización en tu teléfono?</span>
              </p>
              <ol className="list-decimal list-inside text-[11px] text-slate-300 space-y-1 pl-1">
                <li>El archivo <strong>Maxima_Potencia.apk</strong> se descargará en tu barra de notificaciones.</li>
                <li>Toca la notificación de descarga o abre tu carpeta de <em>Descargas</em>.</li>
                <li>Presiona <strong>Instalar / Actualizar</strong>. Todos tus datos y atletas se mantendrán intactos.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
          <span>Publicado: {appUpdateInfo.releaseDate || 'Recientemente'}</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-semibold"
          >
            Recordar más tarde
          </button>
        </div>

      </div>
    </div>
  );
};
