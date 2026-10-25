import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Dumbbell, Info, X } from 'lucide-react';

export const ExercisesView = () => {
  const { exercises } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeExerciseDetail, setActiveExerciseDetail] = useState(null);

  const categories = Object.keys(exercises);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Buscador */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar ejercicio en la biblioteca..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500"
        />
      </div>

      {/* Categorías */}
      <div className="space-y-8">
        {categories.map((category) => {
          const list = (exercises[category] || []).filter(ex => 
            ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ex.description || '').toLowerCase().includes(searchTerm.toLowerCase())
          );

          if (list.length === 0) return null;

          return (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-bold text-white pb-2 border-b border-slate-800 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-red-500" />
                <span>{category}</span>
                <span className="text-xs text-slate-500 font-mono">({list.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {list.map((exercise) => (
                  <div
                    key={exercise.name}
                    onClick={() => setActiveExerciseDetail(exercise)}
                    className="group bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-4 rounded-xl cursor-pointer hover:bg-slate-800/50 transition-all flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-sm text-white group-hover:text-red-400 transition-colors">
                        {exercise.name}
                      </p>
                      {exercise.requiresVelocity && (
                        <span className="inline-block mt-1 text-[10px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">
                          VBT / Velocidad
                        </span>
                      )}
                    </div>
                    <Info className="w-4 h-4 text-slate-500 group-hover:text-slate-300 flex-shrink-0 mt-0.5" />
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setActiveExerciseDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-red-500 mb-3">
              <Dumbbell className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">{activeExerciseDetail.name}</h3>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
              {activeExerciseDetail.description || 'Sin descripción detallada.'}
            </p>

            <div className="mt-5 flex justify-end">
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
    </div>
  );
};
