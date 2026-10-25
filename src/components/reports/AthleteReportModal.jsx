// src/components/reports/AthleteReportModal.jsx
import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { RadarChart } from './RadarChart';
import { exportElementToPdf, shareReportNative } from '../../utils/pdfGenerator';
import { generateAthleteWhatsAppReport, openWhatsApp } from '../../utils/whatsappFormatter';
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
  const { rmRecords, powerRecords, getAthleteGroups, currentCoach } = useApp();
  const reportRef = useRef(null);

  const [pdfTheme, setPdfTheme] = useState('dark'); // 'dark' | 'light'
  const [isExporting, setIsExporting] = useState(false);
  const [coachNotes, setCoachNotes] = useState('Atleta con excelente compromiso y transferencia neuromuscular. Se recomienda priorizar la fase de desaceleración y volumen de trabajo en el rango de potencia máxima (75-80% 1RM).');
  const [athletePhone, setAthletePhone] = useState(athlete?.phone || '');

  // Si no está abierto o no hay atleta
  if (!isOpen || !athlete) return null;

  const athleteGroups = getAthleteGroups(athlete);
  const weight = athlete.weight || 0;
  const height = athlete.height || 0;

  // Filtrar registros del atleta
  const athleteRMs = useMemo(() => {
    return rmRecords.filter(r => r.userId === athlete.id);
  }, [rmRecords, athlete.id]);

  const athletePowers = useMemo(() => {
    return powerRecords.filter(r => r.userId === athlete.id);
  }, [powerRecords, athlete.id]);

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

  // Manejador de descarga de PDF
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const sanitizedName = (athlete.name || 'atleta').toLowerCase().replace(/\s+/g, '_');
      const filename = `ficha_${sanitizedName}_maxima_potencia.pdf`;
      const bg = pdfTheme === 'dark' ? '#0b0f19' : '#ffffff';
      await exportElementToPdf(reportRef.current, filename, {
        backgroundColor: bg,
        quality: 2
      });
    } catch (err) {
      console.error(err);
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

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl relative my-auto max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Barra Superior de Herramientas & Controles */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-950/80 border-b border-slate-800 shrink-0">
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
                onClick={() => setPdfTheme('light')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  !isDark ? 'bg-slate-200 text-slate-900 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Diseño Impresión Limpia (Blanco)"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Impresión Blanco</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Acciones Rápidas (Descargar PDF, WhatsApp, Imprimir) */}
        <div className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
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
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-emerald-950/40 transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-red-950/40 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generando PDF...' : 'Descargar PDF (A4)'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl transition-all"
              title="Imprimir documento"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            {navigator.share && (
              <button
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
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-950/40">
          <div
            ref={reportRef}
            className={`w-full max-w-[800px] mx-auto p-6 sm:p-8 rounded-2xl border transition-all ${
              isDark 
                ? 'bg-[#0b0f19] text-white border-slate-800 shadow-2xl' 
                : 'bg-white text-slate-900 border-slate-300 shadow-md'
            }`}
            style={{ minHeight: '1050px' }}
          >
            {/* Header del Documento */}
            <div className={`pb-6 border-b flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-red-600/30 border border-red-500/40 shrink-0">
                  MP
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase flex items-center gap-2 justify-center sm:justify-start">
                    <span>MÁXIMA POTENCIA</span>
                  </h1>
                  <p className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    Centro de Alto Rendimiento & Análisis VBT
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-right text-xs space-y-1">
                <span className={`inline-block font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  DOC #MP-{athlete.id ? athlete.id.slice(0, 6).toUpperCase() : '001'}
                </span>
                <p className={isDark ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}>
                  Fecha: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <p className={isDark ? 'text-slate-500' : 'text-slate-500'}>
                  Evaluador: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{currentCoach?.name || 'Bayron Quezada'}</strong>
                </p>
              </div>
            </div>

            {/* Perfil del Atleta & Datos Biométricos */}
            <div className={`py-6 border-b flex flex-col sm:flex-row items-center justify-between gap-6 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex items-center justify-center font-black text-2xl shrink-0 shadow-md ${
                  isDark ? 'bg-slate-800 border-red-500/40 text-white' : 'bg-slate-100 border-red-400 text-slate-800'
                }`}>
                  {athlete.photoUrl ? (
                    <img src={athlete.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (athlete.name || 'A').charAt(0)
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-black">{athlete.name}</h2>
                  {athlete.nickname && (
                    <p className={`text-sm font-semibold italic ${isDark ? 'text-red-400' : 'text-red-600'}`}>
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
                            backgroundColor: `${g.color}15`,
                            color: g.color,
                            borderColor: `${g.color}40`
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
                <div className={`p-3 rounded-xl border text-center ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <p className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Peso</p>
                  <p className="text-base font-black mt-0.5">{weight ? `${weight} kg` : '-'}</p>
                </div>
                <div className={`p-3 rounded-xl border text-center ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <p className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Talla</p>
                  <p className="text-base font-black mt-0.5">{height ? `${height} cm` : '-'}</p>
                </div>
                <div className={`p-3 rounded-xl border text-center ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <p className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Fuerza Rel.</p>
                  <p className="text-base font-black mt-0.5 text-red-500">{relSquat !== '-' ? `${relSquat}x` : '-'}</p>
                </div>
              </div>
            </div>

            {/* Radar de Fuerza & KPIs Principales */}
            <div className={`py-6 border-b grid grid-cols-1 md:grid-cols-2 gap-6 items-center ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-red-500" />
                  <span>Perfil Neuromuscular & Fuerza (Radar 5D)</span>
                </h3>
                <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Muestra la simetría atlética entre empuje, tracción, potencia elástica de salto y velocidad VBT.
                </p>
                <RadarChart data={radarData} theme={pdfTheme} size={280} />
              </div>

              {/* Cuadrícula de Mejores Marcas */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Métricas Clave de Rendimiento</span>
                </h3>

                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <p className={`text-[11px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sentadilla (1RM)</p>
                    <p className="text-lg font-black text-red-500">{bestSquat > 0 ? `${bestSquat} kg` : 'Sin registro'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {relSquat}x BW
                    </span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <p className={`text-[11px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Press Banca (1RM)</p>
                    <p className="text-lg font-black">{bestBench > 0 ? `${bestBench} kg` : 'Sin registro'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {relBench}x BW
                    </span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <p className={`text-[11px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Peso Muerto (1RM)</p>
                    <p className="text-lg font-black">{bestDeadlift > 0 ? `${bestDeadlift} kg` : 'Sin registro'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {relDeadlift}x BW
                    </span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <p className={`text-[11px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Salto Vertical CMJ</p>
                    <p className="text-lg font-black text-amber-500">{bestCMJ > 0 ? `${bestCMJ} cm` : 'Sin registro'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {maxVelocity > 0 ? `${maxVelocity} m/s VBT` : 'Potencia'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progresión & Evolución Temporal */}
            {progressions.length > 0 && (
              <div className={`py-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <h3 className="text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>Historial de Ganancia de Fuerza & Progresión</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className={isDark ? 'bg-slate-900/60 text-slate-400' : 'bg-slate-100 text-slate-600'}>
                        <th className="py-2.5 px-3 rounded-l-lg">Ejercicio</th>
                        <th className="py-2.5 px-3 text-center">Marca Inicial</th>
                        <th className="py-2.5 px-3 text-center">Récord Actual</th>
                        <th className="py-2.5 px-3 text-right rounded-r-lg">Ganancia (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {progressions.map((p, idx) => (
                        <tr key={idx} className={isDark ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50'}>
                          <td className="py-2.5 px-3 font-bold">{p.exercise}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{p.initial} kg</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">{p.current} kg</td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-500">
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
              <h3 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span>Observaciones Técnicas & Planificación Recomendada</span>
              </h3>
              
              <div className={`p-4 rounded-xl border text-xs leading-relaxed italic ${
                isDark ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <textarea
                  value={coachNotes}
                  onChange={e => setCoachNotes(e.target.value)}
                  rows="3"
                  className="w-full bg-transparent focus:outline-none resize-none font-sans"
                  placeholder="Escribe tus observaciones y recomendaciones para el atleta antes de exportar..."
                />
              </div>

              {/* Pie de Firma del Coach */}
              <div className="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div>
                  <p className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Informe expedido por Máxima Potencia Performance System
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Medición VBT, 1RM & Biomecánica Deportiva
                  </p>
                </div>

                <div className="text-center sm:text-right">
                  <div className={`w-40 border-b pb-1 mb-1 mx-auto sm:ml-auto ${
                    isDark ? 'border-slate-700' : 'border-slate-400'
                  }`}>
                    <p className="font-bold text-xs">{currentCoach?.name || 'Bayron Quezada'}</p>
                  </div>
                  <p className={`text-[10px] uppercase font-bold tracking-wider ${
                    isDark ? 'text-red-400' : 'text-red-600'
                  }`}>
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
