import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SessionEditor } from './SessionEditor';
import { 
  CalendarPlus, 
  Users, 
  ClipboardList, 
  Trash2, 
  Calendar 
} from 'lucide-react';

export const SessionsView = () => {
  const { sessions, deleteSession } = useApp();
  const [isCreating, setIsCreating] = useState(false);

  if (isCreating) {
    return <SessionEditor onBack={() => setIsCreating(false)} />;
  }

  const sortedSessions = [...sessions].sort((a, b) => {
    const da = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
    const db = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
    return db - da;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Sesiones de Entrenamiento</h3>
          <p className="text-xs text-slate-400 mt-0.5">Historial y planificación de entrenamientos</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-red-900/30 transition-colors"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Nueva Sesión</span>
        </button>
      </div>

      {sortedSessions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          No hay sesiones guardadas todavía. Haz clic en "Nueva Sesión" para registrar una.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedSessions.map((s) => {
            const sessionDate = s.date?.toDate ? s.date.toDate() : new Date(s.date || 0);
            const dateStr = sessionDate.toLocaleDateString('es-ES', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });

            return (
              <div
                key={s.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-red-400 font-semibold mb-2">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {dateStr}
                    </span>
                    <button
                      onClick={() => deleteSession(s.id)}
                      className="text-slate-500 hover:text-red-400 p-1 rounded-lg"
                      title="Eliminar sesión"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-lg font-bold text-white mb-2">Sesión de Equipo</p>

                  <div className="flex gap-4 text-xs text-slate-400 font-medium mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      {s.attendees?.length || 0} Atletas
                    </span>
                    <span className="flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
                      {s.blocks?.length || s.exercises?.length || 0} Bloques
                    </span>
                  </div>

                  {s.blocks && s.blocks.length > 0 && (
                    <div className="space-y-1.5 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/40">
                      {s.blocks.slice(0, 3).map((b, idx) => (
                        <p key={idx} className="text-xs text-slate-300 font-medium truncate">
                          • {b.exercises.join(' + ')}
                        </p>
                      ))}
                      {s.blocks.length > 3 && (
                        <p className="text-[11px] text-slate-500 italic">
                          +{s.blocks.length - 3} bloques más...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
