import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Save, Plus, Trash2, CheckSquare, Square } from 'lucide-react';

export const SessionEditor = ({ onBack }) => {
  const { athletes, groups, exercises, addSession } = useApp();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAttendees, setSelectedAttendees] = useState(athletes.map(a => a.id));
  const [currentBlockExercises, setCurrentBlockExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionBlocks, setSessionBlocks] = useState([]);

  // Lista de todos los ejercicios
  const allExercises = Object.values(exercises).flat().map(e => e.name).sort();

  const toggleAttendee = (id) => {
    if (selectedAttendees.includes(id)) {
      setSelectedAttendees(selectedAttendees.filter(x => x !== id));
    } else {
      setSelectedAttendees([...selectedAttendees, id]);
    }
  };

  const addExerciseToCurrentBlock = () => {
    if (!selectedExercise) return;
    if (!currentBlockExercises.includes(selectedExercise)) {
      setCurrentBlockExercises([...currentBlockExercises, selectedExercise]);
    }
    setSelectedExercise('');
  };

  const removeExerciseFromCurrentBlock = (name) => {
    setCurrentBlockExercises(currentBlockExercises.filter(x => x !== name));
  };

  const saveBlockToSession = () => {
    if (currentBlockExercises.length === 0) return;
    setSessionBlocks([
      ...sessionBlocks,
      {
        id: Date.now(),
        exercises: [...currentBlockExercises],
        notes: sessionNotes
      }
    ]);
    setCurrentBlockExercises([]);
    setSessionNotes('');
  };

  const removeBlock = (id) => {
    setSessionBlocks(sessionBlocks.filter(b => b.id !== id));
  };

  const handleSaveFullSession = async () => {
    if (selectedAttendees.length === 0) {
      alert('Debes seleccionar al menos un atleta en la asistencia.');
      return;
    }

    const payload = {
      date: date,
      attendees: selectedAttendees,
      blocks: sessionBlocks,
      exercises: sessionBlocks.flatMap(b => b.exercises)
    };

    const ok = await addSession(payload);
    if (ok) {
      onBack();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a la lista de sesiones</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-w-0 max-w-full">
        {/* Configuración de Sesión */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 lg:p-8 space-y-6 min-w-0 max-w-full overflow-hidden">
          <h3 className="text-xl font-bold text-white">Configurar Sesión</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Fecha de la Sesión *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase">
                Asistencia de Atletas ({selectedAttendees.length}/{athletes.length})
              </label>
              <div className="flex gap-2 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedAttendees(athletes.map(a => a.id))}
                  className="text-red-400 hover:text-red-300"
                >
                  Todos
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedAttendees([])}
                  className="text-slate-400 hover:text-slate-300"
                >
                  Ninguno
                </button>
              </div>
            </div>

            {/* Carga Rápida por Cuadrilla / Grupo */}
            {groups.length > 0 && (
              <div className="mb-2.5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Marcar por Cuadrilla:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {groups.map(grp => {
                    const grpMembers = athletes
                      .filter(a => (a.groupIds && a.groupIds.includes(grp.id)) || (grp.athleteIds && grp.athleteIds.includes(a.id)))
                      .map(a => a.id);
                    const allSelected = grpMembers.length > 0 && grpMembers.every(id => selectedAttendees.includes(id));

                    return (
                      <button
                        type="button"
                        key={grp.id}
                        onClick={() => {
                          if (allSelected) {
                            setSelectedAttendees(selectedAttendees.filter(id => !grpMembers.includes(id)));
                          } else {
                            setSelectedAttendees(Array.from(new Set([...selectedAttendees, ...grpMembers])));
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                          allSelected
                            ? 'text-white shadow-xs'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                        style={{
                          backgroundColor: allSelected ? grp.color : undefined,
                          borderColor: allSelected ? grp.color : undefined
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: allSelected ? '#ffffff' : grp.color }}
                        />
                        <span>{grp.name}</span>
                        <span className="text-[10px] opacity-80 font-mono">({grpMembers.length})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-2 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              {athletes.map(a => {
                const isSelected = selectedAttendees.includes(a.id);
                return (
                  <div
                    key={a.id}
                    onClick={() => toggleAttendee(a.id)}
                    className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-300 hover:text-white p-1 rounded-lg"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    )}
                    <span>{a.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveFullSession}
            disabled={sessionBlocks.length === 0}
            className={`w-full flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-xl shadow-lg transition-colors ${
              sessionBlocks.length > 0 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/40' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Guardar Sesión Completa</span>
          </button>
        </div>

        {/* Añadir Bloques / Complejos */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 lg:p-8 space-y-6 min-w-0 max-w-full overflow-hidden">
          <h3 className="text-xl font-bold text-white">Bloque de Entrenamiento (Complejo / Superserie)</h3>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 sm:p-4 space-y-3 min-w-0 max-w-full">
            <span className="text-xs font-bold text-slate-300 block">
              1. Selecciona Ejercicios para este Bloque
            </span>

            {/* Tags de ejercicios seleccionados */}
            <div className="flex flex-wrap gap-2 min-h-8">
              {currentBlockExercises.length === 0 ? (
                <span className="text-xs text-slate-500 italic">Ningún ejercicio en el bloque actual.</span>
              ) : (
                currentBlockExercises.map(ex => (
                  <span
                    key={ex}
                    className="inline-flex items-center gap-1.5 bg-red-600/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-lg text-xs font-medium max-w-full truncate"
                  >
                    <span className="truncate">{ex}</span>
                    <button onClick={() => removeExerciseFromCurrentBlock(ex)} className="hover:text-white shrink-0 ml-1">
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-700 min-w-0">
              <select
                value={selectedExercise}
                onChange={e => setSelectedExercise(e.target.value)}
                className="w-full sm:flex-1 min-w-0 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 truncate"
              >
                <option value="">-- Selecciona un ejercicio --</option>
                {allExercises.map(ex => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={addExerciseToCurrentBlock}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-red-950/40"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Notas del Bloque (RPE, Series, Descanso)
            </label>
            <textarea
              rows="2"
              value={sessionNotes}
              onChange={e => setSessionNotes(e.target.value)}
              placeholder="Ej. 4 series x 3 reps @ 80%, 2 min descanso entre rondas..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={saveBlockToSession}
            disabled={currentBlockExercises.length === 0}
            className={`w-full flex items-center justify-center gap-2 font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm ${
              currentBlockExercises.length > 0 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Guardar Bloque en la Sesión</span>
          </button>

          {/* Resumen de Bloques guardados en la sesión actual */}
          <div className="border-t border-slate-800 pt-5">
            <h4 className="text-sm font-bold text-white mb-3">Bloques en esta sesión ({sessionBlocks.length}):</h4>
            {sessionBlocks.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Aún no hay bloques añadidos a esta sesión.</p>
            ) : (
              <div className="space-y-2.5">
                {sessionBlocks.map((b, idx) => (
                  <div key={b.id} className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl flex items-center justify-between min-w-0 gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-red-400">Bloque #{idx + 1}</p>
                      <p className="text-sm font-semibold text-white break-words">{b.exercises.join(' + ')}</p>
                      {b.notes && <p className="text-xs text-slate-400 mt-1 break-words">{b.notes}</p>}
                    </div>
                    <button
                      onClick={() => removeBlock(b.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
