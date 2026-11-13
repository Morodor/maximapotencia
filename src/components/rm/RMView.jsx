import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calculator, Save, TrendingUp, Award, Trash2 } from 'lucide-react';
import { PlateVisualizer } from '../common/PlateVisualizer';

export const RMView = () => {
  const { athletes, exercises, rmRecords, addRMRecord, deleteRMRecord } = useApp();

  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [calcWeight, setCalcWeight] = useState('');
  const [calcReps, setCalcReps] = useState('');
  const [finalWeight, setFinalWeight] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Lista de ejercicios de fuerza, halterofilia (DLP) y complejos (Complexes)
  const availableExercises = [
    ...(exercises['Ley de Hill (Fuerza)'] || []).map(e => e.name),
    ...(exercises['DLP (Derivados del Levantamiento Olímpico)'] || []).map(e => e.name),
    ...(exercises['Complexes / Combinados (DLP)'] || []).map(e => e.name),
    ...Object.entries(exercises || {})
      .filter(([cat]) => !['Ley de Hill (Fuerza)', 'DLP (Derivados del Levantamiento Olímpico)', 'Complexes / Combinados (DLP)', 'Balístico Explosivo'].includes(cat))
      .flatMap(([, list]) => (list || []).map(e => e.name))
  ].sort();

  // Calcular con Brzycki
  const handleCalculateBrzycki = () => {
    const w = parseFloat(calcWeight);
    const r = parseInt(calcReps, 10);
    if (!w || !r) return;
    if (r === 1) {
      setFinalWeight(w.toString());
    } else {
      // Fórmula Brzycki: W * (36 / (37 - R))
      const estimated = w * (36 / (37 - Math.min(r, 12)));
      setFinalWeight(estimated.toFixed(1));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAthlete || !selectedExercise || !finalWeight) return;

    const ok = await addRMRecord({
      userId: selectedAthlete,
      exercise: selectedExercise,
      weight: parseFloat(finalWeight),
      date: date
    });

    if (ok) {
      setFinalWeight('');
      setCalcWeight('');
      setCalcReps('');
    }
  };

  // Mejores récords recientes
  const sortedRecords = [...rmRecords].sort((a, b) => {
    const da = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
    const db = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
    return db - da;
  });

  const getAthleteName = (id) => {
    const a = athletes.find(x => x.id === id);
    return a ? a.name : 'Atleta';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-150">
      {/* Formulario de Registro */}
      <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2.5">
          <TrendingUp className="w-5 h-5 text-red-500" />
          <span>Registrar 1RM (Fuerza Máxima)</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Atleta *
            </label>
            <select
              required
              value={selectedAthlete}
              onChange={e => setSelectedAthlete(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            >
              <option value="">-- Selecciona un atleta --</option>
              {athletes.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Ejercicio *
            </label>
            <select
              required
              value={selectedExercise}
              onChange={e => setSelectedExercise(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            >
              <option value="">-- Selecciona un ejercicio --</option>
              {availableExercises.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </div>

          {/* Calculadora Estimada Brzycki */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-3">
              <Calculator className="w-3.5 h-3.5 text-red-400" />
              Calculadora de 1RM Estimado (Brzycki)
            </span>
            <div className="grid grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  placeholder="Ej. 100"
                  value={calcWeight}
                  onChange={e => setCalcWeight(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Reps realizadas</label>
                <input
                  type="number"
                  placeholder="Ej. 5"
                  value={calcReps}
                  onChange={e => setCalcReps(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleCalculateBrzycki}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs py-2 px-3 rounded-lg transition-colors"
              >
                Calcular
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Peso 1RM Final (kg) *
              </label>
              <input
                type="number"
                step="0.5"
                required
                placeholder="140"
                value={finalWeight}
                onChange={e => setFinalWeight(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Fecha *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>
          </div>

          {(parseFloat(finalWeight) > 0 || parseFloat(calcWeight) > 0) && (
            <div className="pt-2">
              <PlateVisualizer targetWeight={parseFloat(finalWeight) || parseFloat(calcWeight) || 100} />
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-emerald-950/40 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Registro de 1RM</span>
          </button>
        </form>
      </div>

      {/* Historial de Récords 1RM */}
      <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl flex flex-col">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2.5">
          <Award className="w-5 h-5 text-amber-400" />
          <span>Últimos Registros 1RM</span>
        </h3>

        <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[500px] pr-2 space-y-3">
          {sortedRecords.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-12">No hay marcas de 1RM guardadas todavía.</p>
          ) : (
            sortedRecords.map((r) => (
              <div
                key={r.id}
                className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-colors"
              >
                <div>
                  <p className="text-sm font-bold text-white">{r.exercise}</p>
                  <p className="text-xs text-slate-400">{getAthleteName(r.userId)}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {r.date?.toDate ? r.date.toDate().toLocaleDateString('es-ES') : r.date}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-black font-mono text-emerald-400">{r.weight} kg</span>
                  <button
                    onClick={() => deleteRMRecord(r.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
