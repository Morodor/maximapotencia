import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Award, Zap, Scale, Ruler, Cake, History, Activity, FileText, Send } from 'lucide-react';
import { AthleteReportModal } from '../reports/AthleteReportModal';

export const AthleteProfileModal = ({ athlete, isOpen, onClose, onGoToHistory }) => {
  const { rmRecords, powerRecords, getAthleteGroups, setCurrentPanel } = useApp();
  const [isReportOpen, setIsReportOpen] = useState(false);

  if (!isOpen || !athlete) return null;

  // Mejores marcas del atleta
  const athleteRMs = rmRecords.filter(r => r.userId === athlete.id);
  const athletePowers = powerRecords.filter(r => r.userId === athlete.id);

  // Calcular mejores levantamientos
  const bestSquat = athleteRMs
    .filter(r => r.exercise.toLowerCase().includes('sentadilla') && !r.exercise.toLowerCase().includes('arranque'))
    .sort((a, b) => b.weight - a.weight)[0]?.weight || 0;

  const bestSnatch = athleteRMs
    .filter(r => r.exercise.toLowerCase().includes('arranque'))
    .sort((a, b) => b.weight - a.weight)[0]?.weight || 0;

  const bestCMJ = athletePowers
    .filter(r => r.exercise.toLowerCase().includes('cmj') || r.exercise.toLowerCase().includes('salto'))
    .sort((a, b) => (b.distance || 0) - (a.distance || 0))[0]?.distance || 0;

  const weight = athlete.weight || 0;
  const relSquat = weight > 0 && bestSquat > 0 ? (bestSquat / weight).toFixed(2) : '-';
  const relSnatch = weight > 0 && bestSnatch > 0 ? (bestSnatch / weight).toFixed(2) : '-';

  // Agrupar mejores PRs por ejercicio
  const uniquePRs = {};
  athleteRMs.forEach(r => {
    if (!uniquePRs[r.exercise] || r.weight > uniquePRs[r.exercise].value) {
      uniquePRs[r.exercise] = { value: r.weight, unit: 'kg', date: r.date };
    }
  });

  athletePowers.forEach(r => {
    const val = r.distance || r.load || r.velocity || 0;
    const unit = r.distance ? 'cm' : r.velocity ? 'm/s' : 'kg';
    if (!uniquePRs[r.exercise] || val > uniquePRs[r.exercise].value) {
      uniquePRs[r.exercise] = { value: val, unit, date: r.date };
    }
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 w-full max-w-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header del Perfil */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-800 text-center sm:text-left">
          <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-red-500/40 flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden flex-shrink-0">
            {athlete.photoUrl ? (
              <img src={athlete.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (athlete.name || 'A').charAt(0)
            )}
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-white">{athlete.name}</h3>
            {athlete.nickname && (
              <p className="text-red-400 font-medium text-sm">"{athlete.nickname}"</p>
            )}

            {/* Grupos del Atleta */}
            {(() => {
              const athleteGroups = getAthleteGroups(athlete);
              if (athleteGroups.length === 0) return null;
              return (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-2">
                  {athleteGroups.map(g => (
                    <span
                      key={g.id}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-xs"
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
              );
            })()}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-slate-400 font-medium">
              {athlete.weight && (
                <span className="flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-slate-500" /> {athlete.weight} kg
                </span>
              )}
              {athlete.height && (
                <span className="flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5 text-slate-500" /> {athlete.height} cm
                </span>
              )}
              {athlete.dob && (
                <span className="flex items-center gap-1">
                  <Cake className="w-3.5 h-3.5 text-slate-500" /> {athlete.dob}
                </span>
              )}
            </div>
            {athlete.description && (
              <p className="text-xs text-slate-400 mt-2 italic bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
                {athlete.description}
              </p>
            )}
          </div>
        </div>

        {/* KPIs de Fuerza Relativa y Salto */}
        <div className="grid grid-cols-3 gap-4 my-6">
          <div className="bg-slate-800/70 border border-slate-700/50 p-4 rounded-2xl text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Fuerza Rel. (SQ)
            </span>
            <p className="text-2xl font-black text-white font-mono">{relSquat !== '-' ? `${relSquat}x` : '-'}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Sentadilla / Peso</p>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/50 p-4 rounded-2xl text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Fuerza Rel. (SN)
            </span>
            <p className="text-2xl font-black text-white font-mono">{relSnatch !== '-' ? `${relSnatch}x` : '-'}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Arranque / Peso</p>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/50 p-4 rounded-2xl text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Mejor Salto
            </span>
            <p className="text-2xl font-black text-amber-400 font-mono">{bestCMJ > 0 ? `${bestCMJ} cm` : '-'}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Salto CMJ / Vertical</p>
          </div>
        </div>

        {/* Récords Personales (PRs) */}
        <div>
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-red-500" />
              <span>Mejores Marcas Personales (PRs)</span>
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsReportOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-red-950/40 transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ficha Oficial (PDF/WA)</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  setCurrentPanel('analysis');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-semibold transition-colors"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Analizar VBT →</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onGoToHistory(athlete.id);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                <span>Historial</span>
              </button>
            </div>
          </div>

          {Object.keys(uniquePRs).length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Este atleta aún no tiene registros de 1RM o potencia.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(uniquePRs).map(([exercise, data]) => (
                <div key={exercise} className="bg-slate-800/60 border border-slate-700/40 p-3 rounded-xl flex justify-between items-center">
                  <span className="text-xs text-slate-300 font-medium truncate pr-2">{exercise}</span>
                  <span className="text-sm font-bold font-mono text-white flex-shrink-0">
                    {data.value} {data.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Ficha Técnica & Reporte Oficial */}
      <AthleteReportModal
        athlete={athlete}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
};
