import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { History, Filter, Download, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';

export const HistoryView = () => {
  const { athletes, rmRecords, powerRecords, deleteRMRecord, deletePowerRecord } = useApp();

  const [athleteFilter, setAthleteFilter] = useState('');
  const [exerciseFilter, setExerciseFilter] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Combinar registros
  const allRecords = [
    ...rmRecords.map(r => ({
      id: r.id,
      type: '1RM',
      exercise: r.exercise,
      value: `${r.weight} kg`,
      userId: r.userId,
      date: r.date?.toDate ? r.date.toDate() : new Date(r.date || 0)
    })),
    ...powerRecords.map(p => {
      const parts = [];
      if (p.distance) parts.push(`${p.distance} cm`);
      if (p.load) parts.push(`${p.load} kg`);
      if (p.velocity) parts.push(`${p.velocity} m/s`);
      return {
        id: p.id,
        type: 'Potencia',
        exercise: p.exercise,
        value: parts.join(' • ') || '-',
        userId: p.userId,
        date: p.date?.toDate ? p.date.toDate() : new Date(p.date || 0)
      };
    })
  ].sort((a, b) => b.date - a.date);

  // Filtrado
  const filteredRecords = allRecords.filter(r => {
    const matchAthlete = !athleteFilter || r.userId === athleteFilter;
    const matchExercise = !exerciseFilter || r.exercise === exerciseFilter;
    return matchAthlete && matchExercise;
  });

  // Paginación
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const currentPageRecords = filteredRecords.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Lista única de ejercicios presentes en los registros
  const recordedExercises = Array.from(new Set(allRecords.map(r => r.exercise))).sort();

  const getAthleteName = (id) => {
    const a = athletes.find(x => x.id === id);
    return a ? a.name : 'Desconocido';
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `maxima_potencia_historial_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDelete = async (record) => {
    if (confirm(`¿Estás seguro de eliminar este registro de ${record.exercise}?`)) {
      if (record.type === '1RM') {
        await deleteRMRecord(record.id);
      } else {
        await deletePowerRecord(record.id);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Filtros y Exportar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
            <Filter className="w-4 h-4" />
            <span>Filtros:</span>
          </div>

          <select
            value={athleteFilter}
            onChange={e => {
              setAthleteFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Todos los Atletas</option>
            {athletes.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <select
            value={exerciseFilter}
            onChange={e => {
              setExerciseFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Todos los Ejercicios</option>
            {recordedExercises.map(ex => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>

          {(athleteFilter || exerciseFilter) && (
            <button
              onClick={() => {
                setAthleteFilter('');
                setExerciseFilter('');
                setPage(1);
              }}
              className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1"
            >
              Limpiar
            </button>
          )}
        </div>

        <button
          onClick={handleExportJSON}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-colors w-full md:w-auto justify-center"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Exportar a JSON</span>
        </button>
      </div>

      {/* Tabla del Historial */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Fecha</th>
                <th className="py-3.5 px-4">Atleta</th>
                <th className="py-3.5 px-4">Ejercicio</th>
                <th className="py-3.5 px-4 text-center">Tipo</th>
                <th className="py-3.5 px-4 text-right">Resultado</th>
                <th className="py-3.5 px-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {currentPageRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    No se encontraron registros en el historial.
                  </td>
                </tr>
              ) : (
                currentPageRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-5 text-slate-400 text-xs font-mono">
                      {r.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {getAthleteName(r.userId)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      {r.exercise}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        r.type === '1RM' 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      {r.value}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleDelete(r)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-5 py-3 border-t border-slate-800 bg-slate-900/60 text-xs text-slate-400">
            <span>Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
