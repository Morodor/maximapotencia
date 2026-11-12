import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  Dumbbell, 
  Info, 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Zap, 
  ShieldCheck, 
  Save, 
  RotateCcw 
} from 'lucide-react';

export const ExercisesView = () => {
  const { 
    exercises, 
    isHeadCoach, 
    currentCoach,
    addExercise, 
    updateExercise, 
    deleteExercise, 
    resetDefaultExercises 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeExerciseDetail, setActiveExerciseDetail] = useState(null);

  // Estados para Modal de Crear / Editar
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null); // null = nuevo, objeto = editar
  const [formData, setFormData] = useState({
    name: '',
    category: 'Ley de Hill (Fuerza)',
    newCategoryName: '',
    description: '',
    requiresVelocity: false
  });

  const categories = Object.keys(exercises || {});

  // Abre el modal para crear nuevo ejercicio
  const handleOpenCreate = () => {
    setEditingExercise(null);
    setFormData({
      name: '',
      category: categories[0] || 'Fuerza General',
      newCategoryName: '',
      description: '',
      requiresVelocity: true
    });
    setIsEditorOpen(true);
  };

  // Abre el modal para editar ejercicio existente
  const handleOpenEdit = (category, exercise) => {
    setEditingExercise({ originalCategory: category, originalName: exercise.name });
    setFormData({
      name: exercise.name,
      category: category,
      newCategoryName: '',
      description: exercise.description || '',
      requiresVelocity: Boolean(exercise.requiresVelocity)
    });
    setIsEditorOpen(true);
  };

  const handleSaveExercise = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const finalCategory = formData.category === '__NEW__'
      ? formData.newCategoryName.trim()
      : formData.category.trim();

    if (!finalCategory) {
      alert('Debes especificar una categoría para el ejercicio.');
      return;
    }

    let ok = false;
    if (editingExercise) {
      ok = await updateExercise(
        editingExercise.originalCategory,
        editingExercise.originalName,
        {
          name: formData.name,
          category: finalCategory,
          description: formData.description,
          requiresVelocity: formData.requiresVelocity
        }
      );
    } else {
      ok = await addExercise(finalCategory, {
        name: formData.name,
        description: formData.description,
        requiresVelocity: formData.requiresVelocity
      });
    }

    if (ok) {
      setIsEditorOpen(false);
      if (activeExerciseDetail?.name === formData.name) {
        setActiveExerciseDetail(null);
      }
    }
  };

  const handleDeleteExercise = async (category, name) => {
    if (window.confirm(`¿Estás seguro de eliminar el ejercicio "${name}" de la biblioteca?`)) {
      const ok = await deleteExercise(category, name);
      if (ok && activeExerciseDetail?.name === name) {
        setActiveExerciseDetail(null);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Barra Superior de Control */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar ejercicio en la biblioteca..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500"
          />
        </div>

        {/* Botón de Agregar Ejercicio (Admin / Coaches) */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          {isHeadCoach && (
            <button
              onClick={() => {
                if (window.confirm('¿Restablecer todos los ejercicios por defecto de fábrica? Esto conservará la base estándar.')) {
                  resetDefaultExercises();
                }
              }}
              className="text-slate-500 hover:text-slate-300 p-2 rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors text-xs"
              title="Restablecer ejercicios por defecto"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {isHeadCoach ? (
            <button
              onClick={handleOpenCreate}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-red-950/40 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Ejercicio</span>
            </button>
          ) : (
            <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span>Biblioteca Oficial</span>
            </span>
          )}
        </div>
      </div>

      {/* Listado de Categorías y Ejercicios */}
      <div className="space-y-8">
        {categories.map((category) => {
          const list = (exercises[category] || []).filter(ex => 
            ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ex.description || '').toLowerCase().includes(searchTerm.toLowerCase())
          );

          if (list.length === 0) return null;

          return (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-bold text-white pb-2 border-b border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-red-500" />
                  <span>{category}</span>
                  <span className="text-xs text-slate-500 font-mono">({list.length})</span>
                </span>
                {isHeadCoach && (
                  <button
                    onClick={() => {
                      setEditingExercise(null);
                      setFormData({
                        name: '',
                        category: category,
                        newCategoryName: '',
                        description: '',
                        requiresVelocity: true
                      });
                      setIsEditorOpen(true);
                    }}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold hover:bg-slate-800 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-red-500" />
                    <span>Añadir a esta categoría</span>
                  </button>
                )}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {list.map((exercise) => (
                  <div
                    key={exercise.name}
                    className="group bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-4 rounded-xl hover:bg-slate-800/40 transition-all flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div 
                      onClick={() => setActiveExerciseDetail({ ...exercise, category })}
                      className="cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-sm text-white group-hover:text-red-400 transition-colors">
                          {exercise.name}
                        </p>
                        <Info className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0 mt-0.5" />
                      </div>

                      {exercise.requiresVelocity && (
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>VBT / Velocidad</span>
                        </span>
                      )}

                      {exercise.description && (
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                          {exercise.description}
                        </p>
                      )}
                    </div>

                    {/* Acciones de Edición para Coach / Admin */}
                    {isHeadCoach && (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(category, exercise);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
                          title="Editar ejercicio y descripción"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-semibold">Editar</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteExercise(category, exercise.name);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Eliminar ejercicio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Detalle de Ejercicio */}
      {activeExerciseDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setActiveExerciseDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-red-500 mb-2">
              <Dumbbell className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-bold text-white">{activeExerciseDetail.name}</h3>
                <span className="text-xs text-slate-400 font-medium">{activeExerciseDetail.category}</span>
              </div>
            </div>

            {activeExerciseDetail.requiresVelocity && (
              <div className="mb-3">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Requiere Medición de Velocidad (VBT)</span>
                </span>
              </div>
            )}

            <div className="mt-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Descripción y Guía de Ejecución:
              </span>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 max-h-56 overflow-y-auto custom-scrollbar">
                {activeExerciseDetail.description || 'Sin descripción detallada. Puedes agregarle una como Administrador.'}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center">
              {isHeadCoach ? (
                <button
                  onClick={() => {
                    const cat = activeExerciseDetail.category;
                    const ex = activeExerciseDetail;
                    setActiveExerciseDetail(null);
                    handleOpenEdit(cat, ex);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar este ejercicio</span>
                </button>
              ) : <div />}

              <button
                onClick={() => setActiveExerciseDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear o Editar Ejercicio (Admin / Coach) */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center font-bold">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingExercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingExercise ? 'Modifica el nombre, categoría o descripción.' : 'Añade un nuevo ejercicio a la biblioteca de tu gimnasio.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExercise} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                  Nombre del Ejercicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sentadilla Zercher, Hip Thrust Unilateral..."
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__NEW__">+ Crear Nueva Categoría...</option>
                </select>
              </div>

              {formData.category === '__NEW__' && (
                <div className="animate-in fade-in duration-150">
                  <label className="block text-xs font-semibold text-amber-400 mb-1.5 uppercase">
                    Nombre de la Nueva Categoría *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Hipertrofia, Tren Superior, Core..."
                    value={formData.newCategoryName}
                    onChange={e => setFormData({ ...formData, newCategoryName: e.target.value })}
                    className="w-full bg-slate-800 border border-amber-500/50 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                  Descripción y Consejos Técnicos
                </label>
                <textarea
                  rows={4}
                  placeholder="Explica la postura inicial, rango de movimiento, recomendaciones técnicas o adaptaciones..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiresVelocity}
                    onChange={e => setFormData({ ...formData, requiresVelocity: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 text-red-600 focus:ring-red-500 bg-slate-900"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Apto para medición de velocidad / VBT
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Permite medir velocidad de ejecución (m/s) en el módulo de Potencia.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-red-950/50 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingExercise ? 'Guardar Cambios' : 'Añadir Ejercicio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
