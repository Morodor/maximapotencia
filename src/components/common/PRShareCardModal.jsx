import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { X, Download, Share2, MessageCircle, Trophy, Loader2, Check } from 'lucide-react';

export const PRShareCardModal = ({ isOpen, onClose, prData }) => {
  const { activeGymId, registeredGyms, profile, showNotification } = useApp();
  const cardRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen || !prData) return null;

  const {
    athlete = null,
    athleteName = athlete?.name || 'Atleta',
    exercise = 'Levantamiento',
    value = 0,
    unit = 'kg',
    date = null
  } = prData;

  const activeGymObj = registeredGyms?.find(g => g.id === activeGymId);
  const currentGymName = activeGymObj?.name || profile?.gymName || 'Máxima Potencia Club';

  const formattedDate = (() => {
    try {
      if (!date) return new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      const d = date?.toDate ? date.toDate() : new Date(date);
      if (Number.isNaN(d.getTime())) return String(date);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return new Date().toLocaleDateString('es-ES');
    }
  })();

  const numericValue = parseFloat(value);
  const athleteBodyWeight = parseFloat(athlete?.weight);
  const relativeStrength =
    unit === 'kg' && numericValue > 0 && athleteBodyWeight > 0
      ? (numericValue / athleteBodyWeight).toFixed(2)
      : null;

  const safeSlug = (str) =>
    String(str || 'pr')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 32) || 'pr';

  const captureCardCanvas = async () => {
    if (!cardRef.current) return null;
    return html2canvas(cardRef.current, {
      scale: 2,
      backgroundColor: '#090d16',
      useCORS: true,
      allowTaint: true,
      logging: false
    });
  };

  const triggerDownload = (dataUrl, filename) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPng = async () => {
    setIsExporting(true);
    try {
      const canvas = await captureCardCanvas();
      if (!canvas) return;
      const filename = `PR_${safeSlug(athleteName)}_${safeSlug(exercise)}.png`;
      triggerDownload(canvas.toDataURL('image/png'), filename);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2200);
      showNotification?.('Tarjeta de PR descargada en PNG.');
    } catch (err) {
      console.error('Error al exportar tarjeta PR:', err);
      showNotification?.('No se pudo generar la imagen PNG.', true);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareNative = async () => {
    setIsExporting(true);
    try {
      const canvas = await captureCardCanvas();
      if (!canvas) return;
      const filename = `PR_${safeSlug(athleteName)}_${safeSlug(exercise)}.png`;

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const shareText = `🏆 Nuevo Récord Personal (PR)\n👤 ${athleteName}\n🏋️ ${exercise}: ${value} ${unit}\n📅 ${formattedDate} • ${currentGymName}`;

      if (blob && typeof File !== 'undefined' && navigator.share) {
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Nuevo PR • ${athleteName}`,
            text: shareText
          });
          return;
        }
      }

      // Fallback a descarga PNG
      triggerDownload(canvas.toDataURL('image/png'), filename);
      showNotification?.('Imagen descargada para compartir manualmente.');
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.error('Error al compartir PR:', err);
        showNotification?.('No se pudo compartir la tarjeta.', true);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareWhatsApp = () => {
    const relLine = relativeStrength ? `\n⚡ *Fuerza Relativa:* ${relativeStrength}x Peso Corporal` : '';
    const msg =
      `🏆 *¡NUEVO RÉCORD PERSONAL (PR)!*\n` +
      `👤 *Atleta:* ${athleteName}${athlete?.nickname ? ` ("${athlete.nickname}")` : ''}\n` +
      `🏋️ *Ejercicio:* ${exercise}\n` +
      `🔥 *Marca:* ${value} ${unit}${relLine}\n` +
      `📅 *Fecha:* ${formattedDate}\n` +
      `🏟️ *Club:* ${currentGymName}\n\n` +
      `_Registrado con Máxima Potencia Pro_ 🚀`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 my-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Tarjeta Compartible de PR
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lienzo exportable: colores hex/rgba explícitos para compatibilidad total con html2canvas */}
        <div
          ref={cardRef}
          className="rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden select-none"
          style={{
            background: 'linear-gradient(145deg, #090d16 0%, #111827 55%, #1f1116 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#ffffff',
            minHeight: '390px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.55)'
          }}
        >
          {/* Acentos decorativos sutiles sin CSS moderno complejo */}
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '180px',
              height: '180px',
              borderRadius: '9999px',
              background: 'radial-gradient(circle, rgba(220,38,38,0.28) 0%, rgba(220,38,38,0) 70%)',
              pointerEvents: 'none'
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-70px',
              left: '-50px',
              width: '190px',
              height: '190px',
              borderRadius: '9999px',
              background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0) 70%)',
              pointerEvents: 'none'
            }}
          />

          {/* Cabecera Marca + Insignia PR */}
          <div className="flex items-center justify-between gap-2 relative z-10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                MP
              </div>
              <div className="min-w-0">
                <p
                  className="text-[11px] font-black tracking-widest uppercase truncate"
                  style={{ color: '#f8fafc' }}
                >
                  MÁXIMA POTENCIA
                </p>
                <p className="text-[10px] font-semibold truncate" style={{ color: '#94a3b8' }}>
                  {currentGymName}
                </p>
              </div>
            </div>

            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase shrink-0"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.16)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.45)'
              }}
            >
              ★ NUEVO PR
            </span>
          </div>

          {/* Bloque Atleta */}
          <div className="flex flex-col items-center text-center my-5 relative z-10">
            <div
              className="p-1 rounded-full mb-3"
              style={{
                border: '2px solid rgba(245, 158, 11, 0.55)',
                backgroundColor: 'rgba(15, 23, 42, 0.9)'
              }}
            >
              <UserAvatar
                profile={athlete}
                name={athleteName}
                size="xl"
                className="rounded-full"
              />
            </div>

            <h4 className="text-xl font-black tracking-tight" style={{ color: '#ffffff' }}>
              {athleteName}
            </h4>
            {athlete?.nickname && (
              <p className="text-xs font-bold mt-0.5" style={{ color: '#f87171' }}>
                "{athlete.nickname}"
              </p>
            )}
          </div>

          {/* Bloque Marca Destacada */}
          <div
            className="rounded-2xl p-4 text-center relative z-10"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.82)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <p
              className="text-xs font-bold uppercase tracking-wider mb-1"
              style={{ color: '#cbd5e1' }}
            >
              {exercise}
            </p>
            <div className="flex items-baseline justify-center gap-1.5">
              <span
                className="text-4xl sm:text-5xl font-black font-mono tracking-tight"
                style={{ color: '#fbbf24' }}
              >
                {value}
              </span>
              <span className="text-lg font-extrabold uppercase" style={{ color: '#f8fafc' }}>
                {unit}
              </span>
            </div>

            {relativeStrength && (
              <div className="mt-2 flex justify-center">
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full font-mono"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.35)'
                  }}
                >
                  {relativeStrength}x Peso Corporal
                </span>
              </div>
            )}
          </div>

          {/* Pie de Tarjeta */}
          <div
            className="flex items-center justify-between pt-4 mt-4 text-[10px] font-semibold relative z-10"
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8'
            }}
          >
            <span>📅 {formattedDate}</span>
            <span style={{ color: '#cbd5e1' }}>Máxima Potencia Pro</span>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-60"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : downloaded ? (
              <Check className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{downloaded ? 'Listo' : 'PNG'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareNative}
            disabled={isExporting}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-60"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
