import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Zap, Save, Trash2, Award, Camera, Edit3, History, ArrowRight } from 'lucide-react';
import { getVelocityZone } from '../../utils/vbtAnalysis';
import { BarbellCameraTracker } from './BarbellCameraTracker';

export const PowerView = () => {
  const { athletes, exercises, powerRecords, addPowerRecord, deletePowerRecord, setCurrentPanel } = useApp();

  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual' | 'history'

  // Estados de Registro Manual
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Balístico Explosivo');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [distance, setDistance] = useState('');
  const [load, setLoad] = useState('');
  const [velocity, setVelocity] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categoryExercises = (exercises[selectedCategory] || []).map(e => e.name);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAthlete || !selectedExercise) return;

    const payload = {
      userId: selectedAthlete,
      exercise: selectedExercise,
      category: selectedCategory,
      distance: distance ? parseFloat(distance) : null,
      load: load ? parseFloat(load) : null,
      velocity: velocity ? parseFloat(velocity) : null,
      date: date
    };

    const ok = await addPowerRecord(payload);
    if (ok) {
      setDistance('');
      setLoad('');
      setVelocity('');
    }
  };

  const sortedRecords = [...powerRecords].sort((a, b) => {
    const da = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
    const db = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
    return db - da;
  });

  const getAthleteName = (id) => {
    const a = athletes.find(x => x.id === id);
    return a ? a.name : 'Atleta';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Selector de Modos de Potencia */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Módulo de Potencia y VBT</h3>
            <p className="text-xs text-slate-400">Rastreador cinemático óptico o registro por encoders.</p>
          </div>
        </div>

        {/* Pestañas de Modo */}
        <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'camera'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>VBT Cam (En Vivo)</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'manual'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Registro Manual</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial ({powerRecords.length})</span>
          </button>
        </div>
      </div>

      {/* CONTENIDO 1: TRACKER POR CÁMARA */}
      {activeTab === 'camera' && (
        <div className="space-y-6">
          <BarbellCameraTracker 
            onRecordSaved={() => {
              // Notificar y dar opción de ver gráficos
            }} 
          />

          {/* Banner directo hacia el Centro de Análisis */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <span>¿Quieres ver la Curva Carga-Velocidad y el 1RM Estimado?</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Las series grabadas con la cámara se integran de inmediato en la regresión matemática.
              </p>
            </div>
            <button
              onClick={() => setCurrentPanel('analysis')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors whitespace-nowrap"
            >
              <span>Ver Centro de Análisis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* CONTENIDO 2: REGISTRO MANUAL / ENCODERS */}
      {activeTab === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2.5">
              <Edit3 className="w-5 h-5 text-amber-400" />
              <span>Registrar Métricas Manuales o Encoders</span>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                    Categoría *
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={e => {
                      setSelectedCategory(e.target.value);
                      setSelectedExercise('');
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  >
                    {Object.keys(exercises).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
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
                    <option value="">-- Selecciona --</option>
                    {categoryExercises.map(ex => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Métricas: Distancia, Carga, Velocidad */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                    Distancia (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ej. 52.5"
                    value={distance}
                    onChange={e => setDistance(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                    Carga (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Ej. 20"
                    value={load}
                    onChange={e => setLoad(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                    Velocidad (m/s)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej. 1.25"
                    value={velocity}
                    onChange={e => setVelocity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {parseFloat(velocity) > 0 && (() => {
                const z = getVelocityZone(velocity);
                if (!z) return null;
                return (
                  <div 
                    className="p-3 rounded-xl border flex items-center justify-between text-xs animate-in fade-in"
                    style={{ borderColor: `${z.color}50`, backgroundColor: `${z.color}15` }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.color }} />
                      <span className="font-bold text-white">{z.name}</span>
                      <span className="text-slate-400 text-[11px]">• {z.desc}</span>
                    </div>
                    <span className="font-mono font-bold" style={{ color: z.color }}>
                      {velocity} m/s
                    </span>
                  </div>
                );
              })()}

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

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-amber-950/40 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Medición de Potencia</span>
              </button>
            </form>
          </div>

          {/* Historial Breve en modo Manual */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl flex flex-col">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2.5">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Últimos Registros Guardados</span>
            </h3>

            <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[500px] pr-2 space-y-3">
              {sortedRecords.slice(0, 10).map((p) => {
                const metrics = [];
                if (p.distance) metrics.push(`${p.distance} cm`);
                if (p.load) metrics.push(`${p.load} kg`);
                if (p.velocity) metrics.push(`${p.velocity} m/s`);

                return (
                  <div
                    key={p.id}
                    className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{p.exercise}</p>
                      <p className="text-xs text-slate-400">{getAthleteName(p.userId)}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {p.date?.toDate ? p.date.toDate().toLocaleDateString('es-ES') : p.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold font-mono text-amber-400">
                        {metrics.join(' • ')}
                      </span>
                      <button
                        onClick={() => deletePowerRecord(p.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO 3: HISTORIAL COMPLETO */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-800">
            <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
              <History className="w-5 h-5 text-amber-400" />
              <span>Historial Completo de Mediciones de Potencia y VBT</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Total: {sortedRecords.length} registros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Atleta</th>
                  <th className="py-3 px-3">Ejercicio</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">Carga</th>
                  <th className="py-3 px-3">Velocidad</th>
                  <th className="py-3 px-3">Distancia / ROM</th>
                  <th className="py-3 px-3">Notas</th>
                  <th className="py-3 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-500">
                      No hay registros guardados todavía.
                    </td>
                  </tr>
                ) : (
                  sortedRecords.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 text-slate-400 font-mono">
                        {p.date?.toDate ? p.date.toDate().toLocaleDateString('es-ES') : p.date}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">{getAthleteName(p.userId)}</td>
                      <td className="py-3 px-3 text-slate-200">{p.exercise}</td>
                      <td className="py-3 px-3 text-slate-400">{p.category || 'General'}</td>
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {p.load ? `${p.load} kg` : '-'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        {p.velocity ? `${p.velocity} m/s` : '-'}
                      </td>
                      <td className="py-3 px-3 font-mono text-amber-300">
                        {p.distance ? `${p.distance} cm` : '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-400 italic max-w-xs truncate">{p.notes || '-'}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => deletePowerRecord(p.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800"
                          title="Eliminar"
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
        </div>
      )}
    </div>
  );
};
