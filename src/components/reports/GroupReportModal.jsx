// src/components/reports/GroupReportModal.jsx
import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { generateGroupPdfReport } from '../../utils/pdfGenerator';
import { generateGroupWhatsAppReport, openWhatsApp } from '../../utils/whatsappFormatter';
import { 
  X, 
  Download, 
  Send, 
  Printer, 
  Sun, 
  Moon, 
  Users, 
  Award, 
  Trophy, 
  TrendingUp, 
  Zap, 
  Calendar, 
  ShieldCheck,
  Crown
} from 'lucide-react';

export const GroupReportModal = ({ group, isOpen, onClose }) => {
  const { athletes, rmRecords, powerRecords, coaches, currentCoach, showNotification, activeGymId, registeredGyms, profile } = useApp();
  const reportRef = useRef(null);

  const [pdfTheme, setPdfTheme] = useState('light');
  const [isExporting, setIsExporting] = useState(false);

  // Filtrar atletas miembros de esta cuadrilla
  const groupAthletes = useMemo(() => {
    if (!group) return [];
    return athletes.filter(a => 
      (a.groupIds && a.groupIds.includes(group.id)) || 
      (group.athleteIds && group.athleteIds.includes(a.id))
    );
  }, [athletes, group]);

  // Coach a cargo
  const assignedCoach = group ? (coaches.find(c => c.id === group.coachId) || currentCoach) : currentCoach;

  // Helpers para calcular mejores marcas por atleta
  const getAthleteBestLift = (athleteId, keywords) => {
    const list = rmRecords
      .filter(r => r.userId === athleteId && keywords.some(k => (r.exercise || '').toLowerCase().includes(k)))
      .sort((a, b) => b.weight - a.weight);
    return list[0]?.weight || 0;
  };

  const getAthleteBestJump = (athleteId) => {
    const list = powerRecords
      .filter(r => r.userId === athleteId && ((r.exercise || '').toLowerCase().includes('cmj') || (r.exercise || '').toLowerCase().includes('salto')))
      .sort((a, b) => (b.distance || 0) - (a.distance || 0));
    return list[0]?.distance || 0;
  };

  // Métricas consolidadas de la cuadrilla
  const stats = useMemo(() => {
    let totalWeight = 0;
    let weightCount = 0;
    let totalSquat = 0;
    let squatCount = 0;
    let totalBench = 0;
    let benchCount = 0;
    let totalCMJ = 0;
    let cmjCount = 0;

    const athleteSummaries = groupAthletes.map(a => {
      const squat = getAthleteBestLift(a.id, ['sentadilla']);
      const bench = getAthleteBestLift(a.id, ['banca', 'bench']);
      const deadlift = getAthleteBestLift(a.id, ['muerto', 'deadlift']);
      const jump = getAthleteBestJump(a.id);
      const bw = a.weight || 0;

      if (bw > 0) {
        totalWeight += bw;
        weightCount++;
      }
      if (squat > 0) {
        totalSquat += squat;
        squatCount++;
      }
      if (bench > 0) {
        totalBench += bench;
        benchCount++;
      }
      if (jump > 0) {
        totalCMJ += jump;
        cmjCount++;
      }

      const relSquat = bw > 0 && squat > 0 ? parseFloat((squat / bw).toFixed(2)) : 0;

      return {
        id: a.id,
        name: a.name,
        nickname: a.nickname,
        weight: bw,
        squat,
        bench,
        deadlift,
        jump,
        relSquat
      };
    });

    const avgWeight = weightCount > 0 ? (totalWeight / weightCount).toFixed(1) : 0;
    const avgSquat = squatCount > 0 ? (totalSquat / squatCount).toFixed(1) : 0;
    const avgBench = benchCount > 0 ? (totalBench / benchCount).toFixed(1) : 0;
    const avgCMJ = cmjCount > 0 ? (totalCMJ / cmjCount).toFixed(1) : 0;

    // Podios
    const topLifters = [...athleteSummaries]
      .filter(x => x.relSquat > 0)
      .sort((a, b) => b.relSquat - a.relSquat)
      .slice(0, 3)
      .map(x => ({
        name: x.name,
        ratio: x.relSquat,
        exercise: 'Sentadilla',
        weight: x.squat
      }));

    const topJumpers = [...athleteSummaries]
      .filter(x => x.jump > 0)
      .sort((a, b) => b.jump - a.jump)
      .slice(0, 3)
      .map(x => ({
        name: x.name,
        height: x.jump
      }));

    return {
      athleteSummaries,
      avgWeight,
      avgSquat,
      avgBench,
      avgCMJ,
      topLifters,
      topJumpers
    };
  }, [groupAthletes, rmRecords, powerRecords]);

  // Renderizado condicional DESPUÉS de todos los hooks (evita React error #310)
  if (!isOpen || !group) return null;

  const activeGymObj = registeredGyms?.find(g => g.id === activeGymId);
  const gymName = activeGymObj?.name || profile?.gymName || 'Máxima Potencia Club';

  // Manejador descarga directa PDF Cuadrilla (A4 Vectorial)
  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      await generateGroupPdfReport({
        group,
        groupAthletes,
        assignedCoach,
        gymName,
        stats,
        theme: pdfTheme
      });
      showNotification?.('Informe PDF de cuadrilla descargado.');
    } catch (err) {
      console.error(err);
      showNotification?.('Error al generar el PDF de cuadrilla.', true);
    } finally {
      setIsExporting(false);
    }
  };

  // Manejador WhatsApp Cuadrilla
  const handleSendWhatsApp = () => {
    const text = generateGroupWhatsAppReport({
      group,
      coachName: assignedCoach?.name || 'Head Coach',
      athletes: groupAthletes,
      groupStats: stats
    });
    openWhatsApp({ text });
  };

  const isDark = pdfTheme === 'dark';

  const paperColors = isDark
    ? {
        bg: '#0b0f19',
        cardBg: '#121928',
        altBg: '#182134',
        border: '#243047',
        text: '#f8fafc',
        muted: '#94a3b8',
        accent: '#f87171',
        amber: '#fbbf24',
        emerald: '#34d399'
      }
    : {
        bg: '#ffffff',
        cardBg: '#f8fafc',
        altBg: '#e2e8f0',
        border: '#cbd5e1',
        text: '#0f172a',
        muted: '#475569',
        accent: '#dc2626',
        amber: '#d97706',
        emerald: '#059669'
      };

  return (
    <div className="printable-modal-root fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="printable-modal-card bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl relative my-auto max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Barra Superior */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-950/80 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-base sm:text-lg font-black text-white">
              Informe Oficial de Cuadrilla: {group.name}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setPdfTheme('dark')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  isDark ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Oscuro</span>
              </button>
              <button
                type="button"
                onClick={() => setPdfTheme('light')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  !isDark ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                style={!isDark ? { backgroundColor: '#ffffff', color: '#0f172a' } : undefined}
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Blanco</span>
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

        {/* Acciones */}
        <div className="no-print bg-slate-900/90 border-b border-slate-800/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-950/40 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Compartir en Grupo de WhatsApp</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-red-950/40 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generando...' : 'Descargar PDF Cuadrilla'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Contenedor Imprimible */}
        <div className="printable-scroll-wrap p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-950/40">
          <div
            ref={reportRef}
            className="printable-report-sheet w-full max-w-[800px] mx-auto p-6 sm:p-8 rounded-2xl border shadow-2xl transition-colors"
            style={{
              minHeight: '1000px',
              backgroundColor: paperColors.bg,
              color: paperColors.text,
              borderColor: paperColors.border
            }}
          >
            {/* Cabecera */}
            <div className="pb-6 border-b flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: paperColors.border }}>
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg shrink-0"
                  style={{ backgroundColor: group.color || '#ef4444', color: '#ffffff' }}
                >
                  {(group.name || 'G').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight" style={{ color: paperColors.text }}>
                    CUADRILLA: {group.name}
                  </h1>
                  <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: paperColors.accent }}>
                    Informe Colectivo de Rendimiento • {gymName}
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-right text-xs space-y-1">
                <span
                  className="inline-block font-mono font-bold px-2.5 py-0.5 rounded-full border"
                  style={{ backgroundColor: paperColors.altBg, borderColor: paperColors.border, color: paperColors.text }}
                >
                  {groupAthletes.length} Atletas Registrados
                </span>
                <p style={{ color: paperColors.muted }}>
                  Coach: <strong style={{ color: paperColors.text }}>{assignedCoach?.name || 'Bayron Quezada'}</strong>
                </p>
                {group.schedule && (
                  <p style={{ color: paperColors.muted }}>
                    Horario: {group.schedule}
                  </p>
                )}
              </div>
            </div>

            {/* Tarjetas de Promedios del Grupo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6">
              {[
                { label: 'Peso Promedio', val: `${stats.avgWeight} kg`, col: paperColors.text },
                { label: 'Sentadilla Media', val: `${stats.avgSquat} kg`, col: paperColors.accent },
                { label: 'Banca Media', val: `${stats.avgBench} kg`, col: paperColors.text },
                { label: 'Salto CMJ Medio', val: `${stats.avgCMJ} cm`, col: paperColors.amber }
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="p-3.5 rounded-xl border text-center"
                  style={{ backgroundColor: paperColors.cardBg, borderColor: paperColors.border }}
                >
                  <p className="text-[10px] font-bold uppercase" style={{ color: paperColors.muted }}>{kpi.label}</p>
                  <p className="text-xl font-black mt-1" style={{ color: kpi.col }}>{kpi.val}</p>
                </div>
              ))}
            </div>

            {/* Podios de la Cuadrilla */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
              {/* Top Fuerza Relativa */}
              <div className="p-4 rounded-xl border" style={{ backgroundColor: paperColors.cardBg, borderColor: paperColors.border }}>
                <h4 className="text-xs font-black uppercase tracking-wider mb-2.5 flex items-center gap-1.5" style={{ color: paperColors.amber }}>
                  <Crown className="w-4 h-4" />
                  <span>Top Fuerza Relativa (x Peso Corporal)</span>
                </h4>
                {stats.topLifters.length === 0 ? (
                  <p className="text-xs italic" style={{ color: paperColors.muted }}>Sin marcas suficientes</p>
                ) : (
                  <div className="space-y-1.5">
                    {stats.topLifters.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1">
                        <span className="font-bold flex items-center gap-2" style={{ color: paperColors.text }}>
                          <span className="text-sm">{['🥇', '🥈', '🥉'][idx]}</span>
                          <span>{item.name}</span>
                        </span>
                        <span className="font-mono font-bold" style={{ color: paperColors.accent }}>
                          {item.ratio}x BW <span className="text-[10px] font-normal" style={{ color: paperColors.muted }}>({item.weight}kg)</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Saltadores */}
              <div className="p-4 rounded-xl border" style={{ backgroundColor: paperColors.cardBg, borderColor: paperColors.border }}>
                <h4 className="text-xs font-black uppercase tracking-wider mb-2.5 flex items-center gap-1.5" style={{ color: paperColors.amber }}>
                  <Zap className="w-4 h-4" />
                  <span>Top Potencia & Salto CMJ</span>
                </h4>
                {stats.topJumpers.length === 0 ? (
                  <p className="text-xs italic" style={{ color: paperColors.muted }}>Sin saltos registrados</p>
                ) : (
                  <div className="space-y-1.5">
                    {stats.topJumpers.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1">
                        <span className="font-bold flex items-center gap-2" style={{ color: paperColors.text }}>
                          <span className="text-sm">{['🥇', '🥈', '🥉'][idx]}</span>
                          <span>{item.name}</span>
                        </span>
                        <span className="font-mono font-bold" style={{ color: paperColors.amber }}>
                          {item.height} cm
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tabla Detallada de Miembros */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: paperColors.text }}>
                <Users className="w-4 h-4" style={{ color: paperColors.muted }} />
                <span>Nómina y Desempeño Individual de la Cuadrilla</span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: paperColors.altBg, color: paperColors.muted }}>
                      <th className="py-2.5 px-3 rounded-l-lg">Atleta</th>
                      <th className="py-2.5 px-2 text-center">Peso</th>
                      <th className="py-2.5 px-2 text-center">Sentadilla</th>
                      <th className="py-2.5 px-2 text-center">Banca</th>
                      <th className="py-2.5 px-2 text-center">P. Muerto</th>
                      <th className="py-2.5 px-2 text-center">Salto CMJ</th>
                      <th className="py-2.5 px-3 text-right rounded-r-lg">Ratio Rel.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.athleteSummaries.map((ath, idx) => (
                      <tr
                        key={idx}
                        className="border-b"
                        style={{
                          borderColor: paperColors.border,
                          backgroundColor: idx % 2 === 1 ? paperColors.cardBg : 'transparent'
                        }}
                      >
                        <td className="py-2.5 px-3 font-bold" style={{ color: paperColors.text }}>
                          {ath.name} {ath.nickname && <span className="text-[10px]" style={{ color: paperColors.muted }}>"{ath.nickname}"</span>}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono" style={{ color: paperColors.muted }}>{ath.weight ? `${ath.weight} kg` : '-'}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold" style={{ color: paperColors.accent }}>
                          {ath.squat > 0 ? `${ath.squat} kg` : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono" style={{ color: paperColors.text }}>{ath.bench > 0 ? `${ath.bench} kg` : '-'}</td>
                        <td className="py-2.5 px-2 text-center font-mono" style={{ color: paperColors.text }}>{ath.deadlift > 0 ? `${ath.deadlift} kg` : '-'}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold" style={{ color: paperColors.amber }}>
                          {ath.jump > 0 ? `${ath.jump} cm` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black" style={{ color: paperColors.emerald }}>
                          {ath.relSquat > 0 ? `${ath.relSquat}x` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Firma */}
            <div className="mt-8 pt-4 border-t flex items-center justify-between text-[11px]" style={{ borderColor: paperColors.border, color: paperColors.muted }}>
              <p>Generado automáticamente por Máxima Potencia Pro</p>
              <p>Coach a cargo: <strong style={{ color: paperColors.text }}>{assignedCoach?.name}</strong></p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
