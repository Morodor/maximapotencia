import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PlateVisualizer } from '../common/PlateVisualizer';
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
  Layers,
  Copy,
  BookmarkPlus,
  FolderOpen,
  Calculator,
  Dumbbell
} from 'lucide-react';

const TEMPLATES_STORAGE_KEY = 'mp_session_templates';
const PERCENTAGE_PRESETS = [70, 75, 80, 85, 90, 95];

const normalizeExerciseName = (ex) => {
  if (!ex) return '';
  if (typeof ex === 'string') return ex;
  if (typeof ex === 'object') {
    return ex.name || ex.exercise || ex.title || ex.label || '';
  }
  return String(ex);
};

const normalizeBlockExercises = (rawExercises) => {
  const arr = Array.isArray(rawExercises) ? rawExercises : (rawExercises ? [rawExercises] : []);
  return arr.map(normalizeExerciseName).filter(Boolean);
};

export const SessionEditor = ({ sessionToEdit = null, sessionToDuplicate = null, onBack }) => {
  const { athletes, groups, exercises, rmRecords, addSession, updateSession, showNotification } = useApp();
  const isEditing = Boolean(sessionToEdit);
  const isDuplicating = Boolean(sessionToDuplicate && !sessionToEdit);
  const sourceSession = sessionToEdit || sessionToDuplicate;

  const [sessionTitle, setSessionTitle] = useState(() => {
    if (isEditing) return sessionToEdit.title || '';
    if (isDuplicating && sessionToDuplicate?.title) {
      return `${sessionToDuplicate.title} (Copia)`;
    }
    return '';
  });

  const [date, setDate] = useState(() => {
    if (isEditing && sessionToEdit?.date) {
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
    if (sourceSession?.attendees && Array.isArray(sourceSession.attendees)) {
      return sourceSession.attendees;
    }
    return athletes.map(a => a.id);
  });

  const [sessionBlocks, setSessionBlocks] = useState(() => {
    if (sourceSession?.blocks && Array.isArray(sourceSession.blocks)) {
      return sourceSession.blocks.map((b, i) => ({
        id: isDuplicating ? (Date.now() + i) : (b?.id || (Date.now() + i)),
        exercises: normalizeBlockExercises(b?.exercises),
        notes: typeof b?.notes === 'string' ? b.notes : '',
        percentage: b?.percentage || ''
      }));
    }
    if (sourceSession?.exercises && Array.isArray(sourceSession.exercises)) {
      return [{
        id: Date.now(),
        exercises: normalizeBlockExercises(sourceSession.exercises),
        notes: '',
        percentage: ''
      }];
    }
    return [];
  });

  // Estado para creación o edición de un bloque individual
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [currentBlockExercises, setCurrentBlockExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [blockPercentage, setBlockPercentage] = useState('');

  // Calculadora %1RM + Barra Olímpica
  const [calcAthleteId, setCalcAthleteId] = useState(() => {
    if (sourceSession?.attendees?.length > 0) return sourceSession.attendees[0];
    return athletes[0]?.id || '';
  });
  const [calcBarWeight, setCalcBarWeight] = useState(20);
  const [activePlatePreview, setActivePlatePreview] = useState(null);

  // Plantillas de Sesión en localStorage
  const [templates, setTemplates] = useState(() => {
    try {
      const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const savedInventory = useMemo(() => {
    try {
      const saved = localStorage.getItem('mp_plate_inventory');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!calcAthleteId && (selectedAttendees.length > 0 || athletes.length > 0)) {
      setCalcAthleteId(selectedAttendees[0] || athletes[0]?.id || '');
    }
  }, [calcAthleteId, selectedAttendees, athletes]);

  const persistTemplates = (nextList) => {
    setTemplates(nextList);
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(nextList));
    } catch (err) {
      console.error('Error al guardar plantillas:', err);
    }
  };

  const handleSaveTemplate = () => {
    const cleanName = templateName.trim();
    if (!cleanName || sessionBlocks.length === 0) return;

    const newTpl = {
      id: `tpl_${Date.now()}`,
      name: cleanName,
      blocks: sessionBlocks.map(b => ({
        exercises: normalizeBlockExercises(b.exercises),
        notes: b.notes || '',
        percentage: b.percentage || ''
      })),
      createdAt: new Date().toISOString()
    };

    persistTemplates([newTpl, ...templates]);
    setTemplateName('');
    setIsSavingTemplate(false);
    showNotification?.(`Plantilla "${cleanName}" guardada.`);
  };

  const handleApplyTemplate = (tpl) => {
    if (!tpl?.blocks?.length) return;
    const baseTime = Date.now();
    const mapped = tpl.blocks.map((b, i) => ({
      id: baseTime + i,
      exercises: normalizeBlockExercises(b.exercises),
      notes: b.notes || '',
      percentage: b.percentage || ''
    }));

    setSessionBlocks(prev => (prev.length === 0 ? mapped : [...prev, ...mapped]));
    if (!sessionTitle.trim()) {
      setSessionTitle(tpl.name);
    }
    showNotification?.(`Plantilla "${tpl.name}" aplicada (${mapped.length} bloques).`);
  };

  const handleDeleteTemplate = (tplId) => {
    persistTemplates(templates.filter(t => t.id !== tplId));
    showNotification?.('Plantilla eliminada.');
  };

  // Lista de todos los ejercicios disponibles ordenados alfabéticamente
  const allExercises = Object.values(exercises).flat().map(e => e.name).sort();

  // Detectar porcentaje explícito o desde notas (@ 80%)
  const effectivePct = useMemo(() => {
    const explicit = parseFloat(blockPercentage);
    if (!Number.isNaN(explicit) && explicit >= 10 && explicit <= 120) {
      return explicit;
    }
    const match = sessionNotes.match(/(\d{2,3})\s*%/);
    if (match) {
      const detected = parseInt(match[1], 10);
      if (detected >= 10 && detected <= 120) return detected;
    }
    return null;
  }, [blockPercentage, sessionNotes]);

  // Calcular 1RM y carga objetivo para los ejercicios del bloque actual
  const exerciseTargets = useMemo(() => {
    if (!effectivePct || currentBlockExercises.length === 0) return [];
    const targetAthleteId = calcAthleteId || selectedAttendees[0] || athletes[0]?.id;
    return currentBlockExercises.map(exName => {
      const normalized = exName.trim().toLowerCase();
      const matching = (rmRecords || []).filter(r =>
        r.userId === targetAthleteId &&
        String(r.exercise || '').trim().toLowerCase() === normalized
      );
      const bestRM = matching.reduce((max, r) => {
        const w = parseFloat(r.weight) || 0;
        return w > max ? w : max;
      }, 0);
      const targetWeight = bestRM > 0 ? Math.round((bestRM * effectivePct / 100) * 2) / 2 : 0;
      return {
        exercise: exName,
        bestRM,
        targetWeight
      };
    });
  }, [effectivePct, currentBlockExercises, calcAthleteId, selectedAttendees, athletes, rmRecords]);

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
    if (!block) return;
    setEditingBlockId(block.id);
    setCurrentBlockExercises(normalizeBlockExercises(block.exercises));
    setSessionNotes(typeof block.notes === 'string' ? block.notes : '');
    setBlockPercentage(block.percentage ? String(block.percentage) : '');
    setActivePlatePreview(null);
  };

  const cancelEditingBlock = () => {
    setEditingBlockId(null);
    setCurrentBlockExercises([]);
    setSessionNotes('');
    setSelectedExercise('');
    setBlockPercentage('');
    setActivePlatePreview(null);
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
            notes: sessionNotes,
            percentage: effectivePct || null
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
          notes: sessionNotes,
          percentage: effectivePct || null
        }
      ]);
    }

    setCurrentBlockExercises([]);
    setSessionNotes('');
    setSelectedExercise('');
    setBlockPercentage('');
    setActivePlatePreview(null);
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
      title: sessionTitle.trim() || 'Sesión de Entrenamiento',
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
        {isDuplicating && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold w-fit">
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicando Sesión (se guardará como nueva)</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-w-0 max-w-full">
        {/* Configuración de Sesión */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 lg:p-8 space-y-6 min-w-0 max-w-full overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              {isEditing ? 'Modificar Sesión' : isDuplicating ? 'Clonar Sesión' : 'Configurar Sesión'}
            </h3>
            {isEditing && (
              <span className="text-xs text-slate-400 font-mono">ID: {sessionToEdit.id.slice(0, 6)}...</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-400" />
                <span>Fecha *</span>
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Título (opcional)
              </label>
              <input
                type="text"
                value={sessionTitle}
                onChange={e => setSessionTitle(e.target.value)}
                placeholder="Ej. Fuerza & Arranque"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-red-400" />
              <span>Bloques de Entrenamiento</span>
            </h3>
            <div className="flex items-center gap-2">
              {editingBlockId !== null && (
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                  Editando Bloque
                </span>
              )}
              {sessionBlocks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsSavingTemplate(prev => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-white bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-500/30 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Guardar como Plantilla</span>
                </button>
              )}
            </div>
          </div>

          {/* Barra de Plantillas de Sesión */}
          {(isSavingTemplate || templates.length > 0) && (
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 space-y-2.5">
              {isSavingTemplate && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    placeholder="Nombre de la plantilla (ej. Día Arranque + Sentadilla)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleSaveTemplate}
                      disabled={!templateName.trim()}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSavingTemplate(false);
                        setTemplateName('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {templates.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FolderOpen className="w-3 h-3 text-indigo-400" />
                    <span>Plantillas Guardadas (clic para cargar):</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {templates.map(tpl => (
                      <div
                        key={tpl.id}
                        className="inline-flex items-center bg-slate-900/90 border border-slate-700 hover:border-indigo-500/50 rounded-lg overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => handleApplyTemplate(tpl)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-200 hover:text-indigo-300 transition-colors"
                          title={`Aplicar ${tpl.name} (${tpl.blocks?.length || 0} bloques)`}
                        >
                          {tpl.name} <span className="text-[10px] text-slate-500 font-mono">({tpl.blocks?.length || 0})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="px-1.5 py-1 text-slate-500 hover:text-red-400 border-l border-slate-800 transition-colors"
                          title="Eliminar plantilla"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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

          {/* Intensidad %1RM + Asistente de Barra Olímpica */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                <span>Intensidad Objetivo (%1RM)</span>
              </span>
              {effectivePct && !blockPercentage && (
                <span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Detectado de notas: {effectivePct}%
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {PERCENTAGE_PRESETS.map(pct => {
                const isActive = parseFloat(blockPercentage) === pct;
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setBlockPercentage(isActive ? '' : String(pct))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border transition-colors ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                        : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-amber-500/50'
                    }`}
                  >
                    {pct}%
                  </button>
                );
              })}

              <div className="flex items-center gap-1 ml-auto">
                <input
                  type="number"
                  min="10"
                  max="120"
                  placeholder="% Otro"
                  value={blockPercentage}
                  onChange={e => setBlockPercentage(e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {blockPercentage && (
                  <button
                    type="button"
                    onClick={() => {
                      setBlockPercentage('');
                      setActivePlatePreview(null);
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Limpiar %"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {effectivePct && currentBlockExercises.length > 0 && (
              <div className="pt-2.5 border-t border-slate-700/70 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-bold text-slate-400 shrink-0">Atleta:</span>
                    <select
                      value={calcAthleteId}
                      onChange={e => {
                        setCalcAthleteId(e.target.value);
                        setActivePlatePreview(null);
                      }}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 max-w-[180px] truncate"
                    >
                      {athletes.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-[11px] font-bold">
                    {[20, 15].map(bw => (
                      <button
                        key={bw}
                        type="button"
                        onClick={() => setCalcBarWeight(bw)}
                        className={`px-2 py-0.5 rounded-md transition-colors ${
                          calcBarWeight === bw ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Barra {bw}kg
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  {exerciseTargets.map(item => {
                    const isPreviewOpen = activePlatePreview?.exercise === item.exercise;
                    return (
                      <div
                        key={item.exercise}
                        className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 border border-slate-700/60 rounded-lg px-3 py-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{item.exercise}</p>
                          {item.bestRM > 0 ? (
                            <p className="text-[11px] text-slate-400 font-mono">
                              1RM {item.bestRM} kg →{' '}
                              <span className="text-amber-400 font-bold">
                                {item.targetWeight} kg ({effectivePct}%)
                              </span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-500 italic">Sin 1RM registrado para este atleta</p>
                          )}
                        </div>

                        {item.targetWeight > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setActivePlatePreview(isPreviewOpen ? null : { exercise: item.exercise, targetWeight: item.targetWeight })
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors shrink-0 ${
                              isPreviewOpen
                                ? 'bg-red-600 text-white border-red-500'
                                : 'bg-slate-800 text-slate-200 border-slate-600 hover:border-amber-400'
                            }`}
                          >
                            <Dumbbell className="w-3.5 h-3.5" />
                            <span>{isPreviewOpen ? 'Ocultar Barra' : 'Ver Barra'}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {activePlatePreview && (
                  <div className="pt-1">
                    <PlateVisualizer
                      targetWeight={activePlatePreview.targetWeight}
                      barWeight={calcBarWeight}
                      userInventory={savedInventory}
                    />
                  </div>
                )}
              </div>
            )}
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
                        {b.percentage && (
                          <span className="text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                            {b.percentage}% 1RM
                          </span>
                        )}
                        {editingBlockId === b.id && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                            Editando ahora
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-white break-words">
                        {normalizeBlockExercises(b.exercises).length > 0
                          ? normalizeBlockExercises(b.exercises).join(' + ')
                          : <span className="text-slate-500 italic">Bloque sin ejercicios (toca editar o eliminar)</span>}
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
