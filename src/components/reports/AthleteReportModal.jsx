// src/components/reports/AthleteReportModal.jsx
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RadarChart } from './RadarChart';
import { generateAthletePdfReport, shareReportNative } from '../../utils/pdfGenerator';
import { generateAthleteWhatsAppReport, openWhatsApp } from '../../utils/whatsappFormatter';
import { UserAvatar } from '../common/UserAvatar';
import { 
  X, 
  Download, 
  Share2, 
  Printer, 
  Send, 
  Sun, 
  Moon, 
  Award, 
  Zap, 
  TrendingUp, 
  ShieldCheck, 
  Scale, 
  Ruler, 
  Calendar, 
  Edit3,
  CheckCircle2,
  Phone
} from 'lucide-react';

export const AthleteReportModal = ({ athlete, isOpen, onClose }) => {
  const { rmRecords, powerRecords, getAthleteGroups, currentCoach, showNotification, activeGymId, registeredGyms, profile } = useApp();
  const reportRef = useRef(null);

  const [pdfTheme, setPdfTheme] = useState('light'); // 'light' | 'dark'
  const [isExporting, setIsExporting] = useState(false);
  const [coachNotes, setCoachNotes] = useState('Atleta con excelente compromiso y transferencia neuromuscular. Se recomienda priorizar la fase de desaceleración y volumen de trabajo en el rango de potencia máxima (75-80% 1RM).');
  const [athletePhone, setAthletePhone] = useState(athlete?.phone || '');

  useEffect(() => {
    setAthletePhone(athlete?.phone || '');
  }, [athlete?.id, athlete?.phone]);

  const athleteId = athlete?.id || null;
  const athleteGroups = athlete ? getAthleteGroups(athlete) : [];
  const weight = athlete?.weight || 0;
  const height = athlete?.height || 0;

  // Filtrar registros del atleta
  const athleteRMs = useMemo(() => {
    if (!athleteId) return [];
    return rmRecords.filter(r => r.userId === athleteId);
  }, [rmRecords, athleteId]);

  const athletePowers = useMemo(() => {
    if (!athleteId) return [];
    return powerRecords.filter(r => r.userId === athleteId);
  }, [powerRecords, athleteId]);

  // Mejores levantamientos
  const bestSquat = useMemo(() => {
    const list = athleteRMs
      .filter(r => (r.exercise || '').toLowerCase().includes('sentadilla') && !(r.exercise || '').toLowerCase().includes('arranque'))
      .sort((a, b) => b.weight - a.weight);
    return list[0]?.weight || 0;
  }, [athleteRMs]);

  const bestBench = useMemo(() => {
    const list = athleteRMs
      .filter(r => (r.exercise || '').toLowerCase().includes('banca') || (r.exercise || '').toLowerCase().includes('bench'))
      .sort((a, b) => b.weight - a.weight);
    return list[0]?.weight || 0;
  }, [athleteRMs]);

  const bestDeadlift = useMemo(() => {
    const list = athleteRMs
      .filter(r => (r.exercise || '').toLowerCase().includes('muerto') || (r.exercise || '').toLowerCase().includes('deadlift'))
      .sort((a, b) => b.weight - a.weight);
    return list[0]?.weight || 0;
  }, [athleteRMs]);

  const bestSnatch = useMemo(() => {
    const list = athleteRMs
      .filter(r => (r.exercise || '').toLowerCase().includes('arranque') || (r.exercise || '').toLowerCase().includes('snatch'))
      .sort((a, b) => b.weight - a.weight);
    return list[0]?.weight || 0;
  }, [athleteRMs]);

  // Mejor salto CMJ
  const bestCMJ = useMemo(() => {
    const list = athletePowers
      .filter(r => (r.exercise || '').toLowerCase().includes('cmj') || (r.exercise || '').toLowerCase().includes('salto'))
      .sort((a, b) => (b.distance || 0) - (a.distance || 0));
    return list[0]?.distance || 0;
  }, [athletePowers]);

  // Velocidad VBT máxima
  const maxVelocity = useMemo(() => {
    const list = athletePowers
      .filter(r => r.velocity && r.velocity > 0)
      .sort((a, b) => b.velocity - a.velocity);
    return list[0]?.velocity || 0;
  }, [athletePowers]);

  // Ratios relativos
  const relSquat = weight > 0 && bestSquat > 0 ? (bestSquat / weight).toFixed(2) : '-';
  const relBench = weight > 0 && bestBench > 0 ? (bestBench / weight).toFixed(2) : '-';
  const relDeadlift = weight > 0 && bestDeadlift > 0 ? (bestDeadlift / weight).toFixed(2) : '-';

  // Puntajes calculados para el Radar (0 a 100)
  const radarData = useMemo(() => {
    // Escalas de rendimiento atlético estándar
    // Sentadilla: 2.0x peso = 100 pts
    const squatMultiplier = weight > 0 ? bestSquat / weight : bestSquat / 80;
    const squatScore = Math.min(100, Math.round((squatMultiplier / 2.0) * 100)) || 20;

    // Banca: 1.5x peso = 100 pts
    const benchMultiplier = weight > 0 ? bestBench / weight : bestBench / 80;
    const benchScore = Math.min(100, Math.round((benchMultiplier / 1.5) * 100)) || 20;

    // Peso Muerto: 2.4x peso = 100 pts
    const deadMultiplier = weight > 0 ? bestDeadlift / weight : bestDeadlift / 80;
    const deadliftScore = Math.min(100, Math.round((deadMultiplier / 2.4) * 100)) || 20;

    // Salto CMJ: 50 cm = 100 pts
    const jumpScore = Math.min(100, Math.round((bestCMJ / 50) * 100)) || 20;

    // VBT: 1.2 m/s = 100 pts
    const vbtScore = Math.min(100, Math.round((maxVelocity / 1.2) * 100)) || 20;

    return {
      squatRaw: bestSquat > 0 ? `${bestSquat} kg` : 'N/R',
      squatScore,
      benchRaw: bestBench > 0 ? `${bestBench} kg` : 'N/R',
      benchScore,
      deadliftRaw: bestDeadlift > 0 ? `${bestDeadlift} kg` : 'N/R',
      deadliftScore,
      jumpRaw: bestCMJ > 0 ? `${bestCMJ} cm` : 'N/R',
      jumpScore,
      vbtRaw: maxVelocity > 0 ? `${maxVelocity} m/s` : 'N/R',
      vbtScore
    };
  }, [bestSquat, bestBench, bestDeadlift, bestCMJ, maxVelocity, weight]);

  // Cálculo de promedios de progreso (Primer registro vs Actual)
  const progressions = useMemo(() => {
    const exercisesMap = {};
    athleteRMs.forEach(r => {
      const ex = r.exercise;
      if (!exercisesMap[ex]) {
        exercisesMap[ex] = [];
      }
      exercisesMap[ex].push(r);
    });

    const res = [];
    Object.keys(exercisesMap).forEach(ex => {
      const sorted = exercisesMap[ex].sort((a, b) => new Date(a.date) - new Date(b.date));
      if (sorted.length >= 1) {
        const first = sorted[0];
        const best = [...sorted].sort((a, b) => b.weight - a.weight)[0];
        const pct = first.weight > 0 ? (((best.weight - first.weight) / first.weight) * 100).toFixed(1) : 0;
        res.push({
          exercise: ex,
          initial: first.weight,
          initialDate: first.date,
          current: best.weight,
          currentDate: best.date,
          increasePct: parseFloat(pct)
        });
      }
    });
    return res.slice(0, 4);
  }, [athleteRMs]);

  // Renderizado condicional DESPUÉS de todos los hooks (evita React error #310)
  if (!isOpen || !athlete) return null;

  const activeGymObj = registeredGyms?.find(g => g.id === activeGymId);
  const gymName = activeGymObj?.name || profile?.gymName || 'Máxima Potencia Club';

  // Manejador de descarga directa de PDF A4 Vectorial
  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      await generateAthletePdfReport({
        athlete,
        athleteGroups,
        currentCoach,
        gymName,
        bestSquat,
        bestBench,
        bestDeadlift,
        bestSnatch,
        bestCMJ,
        maxVelocity,
        relSquat,
        relBench,
        relDeadlift,
        radarData,
        progressions,
        coachNotes,
        theme: pdfTheme
      });
      showNotification?.('Informe PDF (A4) descargado correctamente.');
    } catch (err) {
      console.error('Error al generar PDF:', err);
      showNotification?.('Error al generar el documento PDF.', true);
    } finally {
      setIsExporting(false);
    }
  };

  // Manejador de WhatsApp
  const handleSendWhatsApp = () => {
    const text = generateAthleteWhatsAppReport({
      athlete,
      coachName: currentCoach?.name || 'Head Coach',
      coachTitle: currentCoach?.title || 'Máxima Potencia',
      bestSquat,
      bestBench,
      bestDeadlift,
      bestSnatch,
      bestCMJ,
      maxVelocity,
      coachNotes,
      groups: athleteGroups
    });
    openWhatsApp({ phone: athletePhone, text });
  };

  // Manejador de compartir nativo
  const handleNativeShare = async () => {
    const text = generateAthleteWhatsAppReport({
      athlete,
      coachName: currentCoach?.name || 'Head Coach',
      coachTitle: currentCoach?.title || 'Máxima Potencia',
      bestSquat,
      bestBench,
      bestDeadlift,
      bestSnatch,
      bestCMJ,
      maxVelocity,
      coachNotes,
      groups: athleteGroups
    });
    await shareReportNative({
      title: `Ficha Técnica: ${athlete.name}`,
      text: text
    });
  };

  const isDark = pdfTheme === 'dark';

  // Paleta aislada para que el tema global de la app nunca invierta los colores del documento oficial
  const paperColors = isDark
    ? {
        bg: '#0b0f19',
        cardBg: '#121928',
        altBg: '#182134',
        border: '#243047',
        text: '#f8fafc',
        muted: '#94a3b8',
        subtle: '#64748b',
        accent: '#f87171',
        amber: '#fbbf24',
        emerald: '#34d399',
        pillBg: 'rgba(239, 68, 68, 0.14)',
        pillBorder: 'rgba(239, 68, 68, 0.35)'
      }
    : {
        bg: '#ffffff',
        cardBg: '#f8fafc',
        altBg: '#e2e8f0',
        border: '#cbd5e1',
        text: '#0f172a',
        muted: '#475569',
        subtle: '#64748b',
        accent: '#dc2626',
        amber: '#d97706',
        emerald: '#059669',
        pillBg: '#fef2f2',
        pillBorder: '#fecaca'
      };

  return (
    <div className="printable-modal-root fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="printable-modal-card bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl relative my-auto max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Barra Superior de Herramientas & Controles */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-slate-950/80 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-red-500" />
            <h3 className="text-base sm:text-lg font-black text-white">
              Ficha Técnica & Reporte Oficial
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle de Tema de Exportación */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setPdfTheme('dark')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  isDark ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Diseño Élite Oscuro"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Oscuro Élite</span>
              </button>
              <button
                type="button"
                onClick={() => setPdfTheme('light')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  !isDark ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                style={!isDark ? { backgroundColor: '#ffffff', color: '#0f172a' } : undefined}
                title="Diseño Impresión Limpia (Blanco)"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Impresión Blanco</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Acciones Rápidas (Descargar PDF, WhatsApp, Imprimir) */}
        <div className="no-print bg-slate-900/90 border-b border-slate-800/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={athletePhone}
                onChange={e => setAthletePhone(e.target.value)}
                placeholder="Nº WhatsApp (+569...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500 placeholder:text-slate-600"
              />
            </div>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-emerald-950/40 transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-red-950/40 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generando PDF...' : 'Descargar PDF (A4)'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl transition-all"
              title="Imprimir documento"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            {navigator.share && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl transition-all"
                title="Compartir"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Contenedor Imprimible de la Ficha Técnica (A4 Standard View) */}
        <div className="printable-scroll-wrap p-3 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-950/40">
          <div
            ref={reportRef}
            className="printable-report-sheet w-full max-w-[800px] mx-auto p-6 sm:p-8 rounded-2xl border shadow-2xl transition-colors"
            style={{
              minHeight: '1020px',
              backgroundColor: paperColors.bg,
              color: paperColors.text,
              borderColor: paperColors.border
            }}
          >
            {/* Header del Documento */}
            <div
              className="pb-6 border-b flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ borderColor: paperColors.border }}
            >
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    color: '#ffffff',
                    border: '1px solid rgba(239, 68, 68, 0.4)'
                  }}
                >
                  MP
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase" style={{ color: paperColors.text }}>
                    MÁXIMA POTENCIA
                  </h1>
                  <p className="text-xs font-bold tracking-wider uppercase" style={{ color: paperColors.accent }}>
                    {gymName} • Análisis de Rendimiento
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-right text-xs space-y-1">
                <span
                  className="inline-block font-mono font-bold px-2.5 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: paperColors.pillBg,
                    borderColor: paperColors.pillBorder,
                    color: paperColors.accent
                  }}
                >
                  DOC #MP-{athlete.id ? athlete.id.slice(0, 6).toUpperCase() : '001'}
                </span>
                <p className="font-medium" style={{ color: paperColors.muted }}>
                  Fecha: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <p style={{ color: paperColors.subtle }}>
                  Evaluador: <strong style={{ color: paperColors.text }}>{currentCoach?.name || 'Bayron Quezada'}</strong>
                </p>
              </div>
            </div>

            {/* Perfil del Atleta & Datos Biométricos */}
            <div
              className="py-6 border-b flex flex-col sm:flex-row items-center justify-between gap-6"
              style={{ borderColor: paperColors.border }}
            >
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <UserAvatar
                  profile={athlete}
                  size="xl"
                  className="rounded-2xl"
                />
                <div>
                  <h2 className="text-2xl font-black" style={{ color: paperColors.text }}>{athlete.name}</h2>
                  {athlete.nickname && (
                    <p className="text-sm font-semibold italic" style={{ color: paperColors.accent }}>
                      "{athlete.nickname}"
                    </p>
                  )}
                  {athleteGroups.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 justify-center sm:justify-start">
                      {athleteGroups.map(g => (
                        <span
                          key={g.id}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: `${g.color}18`,
                            color: g.color,
                            borderColor: `${g.color}45`
                          }}
                        >
                          ● {g.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tarjetas Biométricas Rápidas */}
              <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
                <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: paperColors.cardBg, borderColor: paperColors.border }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color: paperColors.muted }}>Peso</p>
                  <p className="text-base font-black mt-0.5" style={{ color: paperColors.text }}>{weight ? `${weight} kg` : '-'}</p>
                </div>
                <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: paperColors.cardBg, borderColor: paperColors.border }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color: paperColors.muted }}>Talla</p>
                  <p className="text-base font-black mt-0.5" style={{ color: paperColors.text }}>{height ? `${height} cm` : '-'}</p>
                </div>
                <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: paperColors.cardBg, borderColor: paperColors.border }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color: paperColors.muted }}>Fuerza Rel.</p>
                  <p className="text-base font-black mt-0.5" style={{ color: paperColors.accent }}>{relSquat !== '-' ? `${relSquat}x` : '-'}</p>
                </div>
              </div>
            </div>

            {/* Radar de Fuerza & KPIs Principales */}
            <div
              className="py-6 border-b grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
              style={{ borderColor: paperColors.border }}
            >
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: paperColors.text }}>
                  <Award className="w-4 h-4 shrink-0" style={{ color: paperColors.accent }} />
                  <span>Perfil Neuromuscular & Fuerza (Radar 5D)</span>
                </h3>
                <p className="text-xs mb-3" style={{ color: paperColors.muted }}>
                  Muestra la simetría atlética entre empuje, tracción, potencia elástica de salto y velocidad VBT.
                </p>
                <RadarChart data={radarData} theme={pdfTheme} size={270} />
              </div>

              {/* Cuadrícula de Mejores Marcas */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: paperColors.text }}>
                  <Zap className="w-4 h-4 shrink-0" style={{ color: paperColors.amber }} />
                  <span>Métricas Clave de Rendimiento</span>
                </h3>

                {[
                  { title: 'Sentadilla (1RM)', val: bestSquat > 0 ? `${bestSquat} kg` : 'Sin registro', badge: `${relSquat}x BW`, valColor: bestSquat > 0 ? paperColors.accent : paperColors.muted },
                  { title: 'Press Banca (1RM)', val: bestBench > 0 ? `${bestBench} kg` : 'Sin registro', badge: `${relBench}x BW`, valColor: bestBench > 0 ? paperColors.text : paperColors.muted },
                  { title: 'Peso Muerto (1RM)', val: bestDeadlift > 0 ? `${bestDeadlift} kg` : 'Sin registro', badge: `${relDeadlift}x BW`, valColor: bestDeadlift > 0 ? paperColors.text : paperColors.muted },
                  { title: 'Arranque / Snatch (1RM)', val: bestSnatch > 0 ? `${bestSnatch} kg` : 'Sin registro', badge: weight > 0 && bestSnatch > 0 ? `${(bestSnatch / weight).toFixed(2)}x BW` : 'Halterofilia', valColor: bestSnatch > 0 ? paperColors.emerald : paperColors.muted },
                  { title: 'Salto Vertical CMJ', val: bestCMJ > 0 ? `${bestCMJ} cm` : 'Sin registro', badge: maxVelocity > 0 ? `${maxVelocity} m/s VBT` : 'Potencia', valColor: bestCMJ > 0 ? paperColors.amber : paperColors.muted }
                ].map((metric) => (
                  <div
                    key={metric.title}
                    className="p-3 rounded-xl border flex items-center justify-between"
                    style={{ backgroundColor: paperColors.cardBg, borderColor: paperColors.border }}
                  >
                    <div>
                      <p className="text-[11px] font-bold uppercase" style={{ color: paperColors.muted }}>{metric.title}</p>
                      <p className="text-lg font-black" style={{ color: metric.valColor }}>{metric.val}</p>
                    </div>
                    <span
                      className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: paperColors.altBg, color: paperColors.text }}
                    >
                      {metric.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progresión & Evolución Temporal */}
            {progressions.length > 0 && (
              <div className="py-6 border-b" style={{ borderColor: paperColors.border }}>
                <h3 className="text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: paperColors.text }}>
                  <TrendingUp className="w-4 h-4 shrink-0" style={{ color: paperColors.emerald }} />
                  <span>Historial de Ganancia de Fuerza & Progresión</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: paperColors.altBg, color: paperColors.muted }}>
                        <th className="py-2.5 px-3 rounded-l-lg">Ejercicio</th>
                        <th className="py-2.5 px-3 text-center">Marca Inicial</th>
                        <th className="py-2.5 px-3 text-center">Récord Actual</th>
                        <th className="py-2.5 px-3 text-right rounded-r-lg">Ganancia (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {progressions.map((p, idx) => (
                        <tr
                          key={idx}
                          className="border-b"
                          style={{
                            borderColor: paperColors.border,
                            backgroundColor: idx % 2 === 1 ? paperColors.cardBg : 'transparent'
                          }}
                        >
                          <td className="py-2.5 px-3 font-bold" style={{ color: paperColors.text }}>{p.exercise}</td>
                          <td className="py-2.5 px-3 text-center font-mono" style={{ color: paperColors.muted }}>{p.initial} kg</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold" style={{ color: paperColors.text }}>{p.current} kg</td>
                          <td className="py-2.5 px-3 text-right font-mono font-black" style={{ color: p.increasePct > 0 ? paperColors.emerald : paperColors.muted }}>
                            {p.increasePct > 0 ? `+${p.increasePct}%` : 'Base'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Diagnóstico & Observaciones Técnicas del Coach */}
            <div className="py-6">
              <h3 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: paperColors.text }}>
                <Edit3 className="w-4 h-4 shrink-0" style={{ color: '#3b82f6' }} />
                <span>Observaciones Técnicas & Planificación Recomendada</span>
              </h3>
              
              <div
                className="p-4 rounded-xl border text-xs leading-relaxed italic"
                style={{
                  backgroundColor: paperColors.cardBg,
                  borderColor: paperColors.border,
                  color: paperColors.text
                }}
              >
                <textarea
                  value={coachNotes}
                  onChange={e => setCoachNotes(e.target.value)}
                  rows="3"
                  className="w-full bg-transparent focus:outline-none resize-none font-sans"
                  style={{ color: paperColors.text }}
                  placeholder="Escribe tus observaciones y recomendaciones para el atleta antes de exportar..."
                />
              </div>

              {/* Pie de Firma del Coach */}
              <div className="mt-8 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ borderColor: paperColors.border }}>
                <div>
                  <p className="font-semibold" style={{ color: paperColors.muted }}>
                    Informe expedido por Máxima Potencia Performance System
                  </p>
                  <p className="text-[10px]" style={{ color: paperColors.subtle }}>
                    Medición VBT, 1RM & Biomecánica Deportiva
                  </p>
                </div>

                <div className="text-center sm:text-right">
                  <div className="w-44 border-b pb-1 mb-1 mx-auto sm:ml-auto" style={{ borderColor: paperColors.border }}>
                    <p className="font-bold text-xs" style={{ color: paperColors.text }}>{currentCoach?.name || 'Bayron Quezada'}</p>
                  </div>
                  <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: paperColors.accent }}>
                    {currentCoach?.title || 'Head Coach & Director Técnico'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
