import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Square, 
  Edit3, 
  X, 
  Check, 
  Calendar, 
  Layers 
} from 'lucide-react';

export const SessionEditor = ({ sessionToEdit = null, onBack }) => {
  const { athletes, groups, exercises, addSession, updateSession } = useApp();
  const isEditing = Boolean(sessionToEdit);

  const [date, setDate] = useState(() => {
    if (sessionToEdit?.date) {
      if (sessionToEdit.date.toDate) {
        return sessionToEdit.date.toDate().toISOString().split('T')[0];
      }
      if (typeof sessionToEdit.date === 'string') {
        return sessionToEdit.date.slice(0, 10);
      }
    }
    return new Date().toISOString().split('T')[0];
  });

  const [selectedAttendees, setSelectedAttendees] = useState(() => {
    if (sessionToEdit?.attendees && Array.isArray(sessionToEdit.attendees)) {
      return sessionToEdit.attendees;
    }
    return athletes.map(a => a.id);
  });

  const [sessionBlocks, setSessionBlocks] = useState(() => {
    if (sessionToEdit?.blocks && Array.isArray(sessionToEdit.blocks)) {
      return sessionToEdit.blocks.map((b, i) => ({
        id: b.id || (Date.now() + i),
        exercises: Array.isArray(b.exercises) ? [...b.exercises] : [b.exercises].filter(Boolean),
        notes: b.notes || ''
      }));
    }
    if (sessionToEdit?.exercises && Array.isArray(sessionToEdit.exercises)) {
      return [{
        id: Date.now(),
        exercises: [...sessionToEdit.exercises],
        notes: ''
      }];
    }
    return [];
  });

  // Estado para creación o edición de un bloque individual
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [currentBlockExercises, setCurrentBlockExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  // Lista de todos los ejercicios disponibles ordenados alfabéticamente
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

  // Carga un bloque existente en el formulario para editarlo
  const startEditingBlock = (block) => {
    setEditingBlockId(block.id);
    setCurrentBlockExercises([...block.exercises]);
    setSessionNotes(block.notes || '');
  };

  const cancelEditingBlock = () => {
    setEditingBlockId(null);
    setCurrentBlockExercises([]);
    setSessionNotes('');
    setSelectedExercise('');
  };

  // Guarda o actualiza un bloque en la sesión
  const saveBlockToSession = () => {
    if (currentBlockExercises.length === 0) return;

    if (editingBlockId !== null) {
      // Actualizar bloque existente
      setSessionBlocks(sessionBlocks.map(b => {
        if (b.id === editingBlockId) {
          return {
            ...b,
            exercises: [...currentBlockExercises],
            notes: sessionNotes
          };
        }
        return b;
      }));
      setEditingBlockId(null);
    } else {
      // Agregar nuevo bloque
      setSessionBlocks([
        ...sessionBlocks,
        {
          id: Date.now(),
          exercises: [...currentBlockExercises],
          notes: sessionNotes
        }
      ]);
    }

    setCurrentBlockExercises([]);
    setSessionNotes('');
    setSelectedExercise('');
  };

  const removeBlock = (id) => {
    if (editingBlockId === id) {
      cancelEditingBlock();
    }
    setSessionBlocks(sessionBlocks.filter(b => b.id !== id));
  };

  const handleSaveFullSession = async () => {
    if (selectedAttendees.length === 0) {
      alert('Debes seleccionar al menos un atleta en la asistencia.');
      return;
    }
    if (sessionBlocks.length === 0) {
      alert('Debes agregar al menos un bloque de ejercicios a la sesión.');
      return;
    }

    const payload = {
      date: date,
      attendees: selectedAttendees,
      blocks: sessionBlocks,
      exercises: sessionBlocks.flatMap(b => b.exercises)
    };

    let ok = false;
    if (isEditing) {
      ok = await updateSession(sessionToEdit.id, payload);
    } else {
      ok = await addSession(payload);
    }

    if (ok) {
      onBack();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la lista de sesiones</span>
        </button>

        {isEditing && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold w-fit">
            <Edit3 className="w-3.5 h-3.5" />
            <span>Modo Edición Activado</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-w-0 max-w-full">
        {/* Configuración de Sesión */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 lg:p-8 space-y-6 min-w-0 max-w-full overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              {isEditing ? 'Modificar Sesión' : 'Configurar Sesión'}
            </h3>
            {isEditing && (
              <span className="text-xs text-slate-400 font-mono">ID: {sessionToEdit.id.slice(0, 6)}...</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-red-400" />
              <span>Fecha de la Sesión *</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
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
            className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all active:scale-98 ${
              sessionBlocks.length > 0 
                ? isEditing
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/40' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Guardar Cambios de la Sesión' : 'Guardar Sesión Completa'}</span>
          </button>
        </div>

        {/* Añadir / Modificar Bloques */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 lg:p-8 space-y-6 min-w-0 max-w-full overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-red-400" />
              <span>Bloques de Entrenamiento</span>
            </h3>
            {editingBlockId !== null && (
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                Editando Bloque
              </span>
            )}
          </div>

          <div className={`border rounded-xl p-3 sm:p-4 space-y-3 min-w-0 max-w-full transition-all ${
            editingBlockId !== null 
              ? 'bg-amber-950/20 border-amber-500/40' 
              : 'bg-slate-800/60 border-slate-700/60'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 block">
                {editingBlockId !== null ? 'Modificando Ejercicios del Bloque:' : '1. Selecciona Ejercicios para este Bloque:'}
              </span>
              {editingBlockId !== null && (
                <button
                  type="button"
                  onClick={cancelEditingBlock}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>
              )}
            </div>

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
                    <button 
                      type="button" 
                      onClick={() => removeExerciseFromCurrentBlock(ex)} 
                      className="hover:text-white shrink-0 ml-1"
                    >
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
              Notas del Bloque (RPE, Series, Descanso, Porcentajes)
            </label>
            <textarea
              rows="2"
              value={sessionNotes}
              onChange={e => setSessionNotes(e.target.value)}
              placeholder="Ej. 4 series x 3 reps @ 80%, 2 min descanso entre rondas..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveBlockToSession}
              disabled={currentBlockExercises.length === 0}
              className={`flex-1 flex items-center justify-center gap-2 font-bold py-2.5 px-4 rounded-xl transition-all text-sm ${
                currentBlockExercises.length > 0 
                  ? editingBlockId !== null
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {editingBlockId !== null ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{editingBlockId !== null ? 'Actualizar Bloque' : 'Guardar Bloque en la Sesión'}</span>
            </button>

            {editingBlockId !== null && (
              <button
                type="button"
                onClick={cancelEditingBlock}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>

          {/* Resumen de Bloques guardados en la sesión */}
          <div className="border-t border-slate-800 pt-5">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              <span>Bloques en esta sesión ({sessionBlocks.length}):</span>
              <span className="text-xs text-slate-400 font-normal">Toca editar para modificar</span>
            </h4>
            {sessionBlocks.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Aún no hay bloques añadidos a esta sesión.</p>
            ) : (
              <div className="space-y-2.5">
                {sessionBlocks.map((b, idx) => (
                  <div 
                    key={b.id} 
                    className={`p-3.5 rounded-xl border flex items-center justify-between min-w-0 gap-3 transition-all ${
                      editingBlockId === b.id 
                        ? 'bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/30' 
                        : 'bg-slate-800/80 border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-red-400">Bloque #{idx + 1}</span>
                        {editingBlockId === b.id && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                            Editando ahora
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-white break-words">
                        {Array.isArray(b.exercises) ? b.exercises.join(' + ') : b.exercises}
                      </p>
                      {b.notes && (
                        <p className="text-xs text-slate-400 mt-1 break-words italic">
                          {b.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditingBlock(b)}
                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-700/60 rounded-lg transition-colors"
                        title="Modificar este bloque"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(b.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/60 rounded-lg transition-colors"
                        title="Eliminar este bloque"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
