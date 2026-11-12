import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  ArrowRight, 
  Smartphone, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  getSuiteConfig, 
  saveSuiteConfig, 
  checkSpeedTrackerInstalled, 
  launchSpeedTracker 
} from '../../utils/suiteLauncher';

export const SpeedTrackerModal = ({ 
  isOpen, 
  onClose, 
  athleteName = 'Atleta', 
  exercise = 'Sentadilla (Squat)', 
  load = '100' 
}) => {
  const [suiteConfig, setSuiteConfig] = useState(getSuiteConfig());
  const [detectStatus, setDetectStatus] = useState({ checking: true, installed: null });
  const [launchMessage, setLaunchMessage] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [pkgInput, setPkgInput] = useState('');
  const [schemeInput, setSchemeInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      const cfg = getSuiteConfig();
      setSuiteConfig(cfg);
      setPkgInput(cfg.speedTracker.packageName);
      setSchemeInput(cfg.speedTracker.scheme);
      setLaunchMessage(null);
      checkInstallStatus();
    }
  }, [isOpen]);

  const checkInstallStatus = async () => {
    setDetectStatus({ checking: true, installed: null });
    const res = await checkSpeedTrackerInstalled();
    if (res === null) {
      setDetectStatus({ checking: false, installed: null, platform: 'web' });
    } else {
      setDetectStatus({ checking: false, installed: res.installed, packageName: res.packageName, platform: 'android' });
    }
  };

  if (!isOpen) return null;

  const handleLaunch = async () => {
    setLaunchMessage({ type: 'loading', text: 'Iniciando vinculación con Speed Tracker...' });
    const result = await launchSpeedTracker({
      athleteName,
      exercise,
      load: parseFloat(load) || 0
    });

    if (result.success) {
      setLaunchMessage({
        type: 'success',
        text: result.method === 'native' || result.method === 'native-alt'
          ? '¡Speed Tracker abierto con éxito en tu dispositivo!'
          : 'Redirección a Speed Tracker iniciada.'
      });
      setTimeout(() => {
        onClose();
      }, 1800);
    } else {
      setLaunchMessage({
        type: 'error',
        text: result.message || 'No se pudo abrir automáticamente. Verifica que Speed Tracker esté instalado.'
      });
    }
  };

  const handleSaveConfig = () => {
    const updated = {
      ...suiteConfig,
      speedTracker: {
        ...suiteConfig.speedTracker,
        packageName: pkgInput.trim() || 'com.speedtracker',
        scheme: schemeInput.trim() || 'speedtracker://'
      }
    };
    saveSuiteConfig(updated);
    setSuiteConfig(updated);
    setShowConfig(false);
    checkInstallStatus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Encabezado */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 fill-red-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white whitespace-nowrap">Suite Máxima Potencia</h3>
                <span className="inline-flex items-center justify-center text-center whitespace-nowrap text-[10px] sm:text-[11px] bg-red-600 text-white font-bold px-3 py-0.5 rounded-full shadow-sm tracking-wide shrink-0">
                  Speed Tracker
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5">
                Análisis cinemático óptico de precisión empírica
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Ficha del levantamiento a transferir */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
              Contexto de la Serie para Speed Tracker
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-500 block">Atleta</span>
                <span className="text-xs font-bold text-white truncate block">{athleteName}</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-500 block">Ejercicio</span>
                <span className="text-xs font-bold text-amber-400 truncate block">{exercise}</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-500 block">Carga</span>
                <span className="text-xs font-bold text-emerald-400 block font-mono">{load} kg</span>
              </div>
            </div>
          </div>

          {/* Estado de detección en el dispositivo */}
          <div className="p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 bg-slate-800/40 border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-slate-300 font-semibold block">Detección de Speed Tracker:</span>
                <span className="text-[11px] text-slate-400">
                  {detectStatus.checking ? (
                    'Comprobando instalación en Android...'
                  ) : detectStatus.platform === 'android' ? (
                    detectStatus.installed ? (
                      <span className="text-emerald-400 font-bold">App instalada y lista ({detectStatus.packageName})</span>
                    ) : (
                      <span className="text-amber-400 font-bold">No detectada con el ID actual</span>
                    )
                  ) : (
                    <span className="text-blue-400">Enlace por esquema y web activo</span>
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
              title="Configurar paquete o esquema"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Formulario de Configuración Rápida de Paquete */}
          {showConfig && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Configuración de Paquete Speed Tracker</span>
                </span>
                <button
                  onClick={checkInstallStatus}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reverificar</span>
                </button>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  ID de Paquete Android (Package Name)
                </label>
                <input
                  type="text"
                  value={pkgInput}
                  onChange={e => setPkgInput(e.target.value)}
                  placeholder="com.speedtracker"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Ejemplo: com.speedtracker o com.bayronquezada.speedtracker
                </span>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Esquema URI (Deep Link)
                </label>
                <input
                  type="text"
                  value={schemeInput}
                  onChange={e => setSchemeInput(e.target.value)}
                  placeholder="speedtracker://"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
                >
                  Guardar ID
                </button>
              </div>
            </div>
          )}

          {/* Mensaje de feedback de lanzamiento */}
          {launchMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
                launchMessage.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                  : launchMessage.type === 'error'
                  ? 'bg-amber-950/40 border border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border border-slate-700 text-slate-200'
              }`}
            >
              {launchMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{launchMessage.text}</span>
            </div>
          )}

          {/* Información de la Suite */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-400 space-y-2 leading-relaxed">
            <p className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <span>¿Cómo funciona la Suite?</span>
            </p>
            <p>
              Al presionar <strong>"Abrir Speed Tracker"</strong>, Máxima Potencia transmite los datos de la serie activa para que grabes y calibres tu levantamiento directamente con los algoritmos especializados de Speed Tracker.
            </p>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Permanecer en Máxima Potencia
          </button>

          <button
            onClick={handleLaunch}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-950/50 transition-all active:scale-95"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Abrir Speed Tracker Ahora</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
