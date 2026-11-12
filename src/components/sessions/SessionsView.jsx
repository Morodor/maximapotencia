import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SessionEditor } from './SessionEditor';
import { 
  CalendarPlus, 
  Users, 
  ClipboardList, 
  Trash2, 
  Calendar,
  Edit3,
  Clock,
  Share2,
  MessageCircle
} from 'lucide-react';

export const SessionsView = () => {
  const { sessions, deleteSession, athletes } = useApp();
  const [isCreating, setIsCreating] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  const handleShareWhatsApp = (s) => {
    const sessionDate = s.date?.toDate ? s.date.toDate() : new Date(s.date || 0);
    const dateStr = sessionDate.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    let text = `🔥 *MÁXIMA POTENCIA* • ${s.title || 'Sesión de Entrenamiento'}\n`;
    text += `📅 *Fecha:* ${dateStr}\n`;
    
    if (s.attendees && s.attendees.length > 0) {
      const names = s.attendees.map(id => athletes.find(a => a.id === id)?.name || 'Atleta').join(', ');
      text += `👥 *Atletas convocados:* ${names}\n`;
    }

    if (s.blocks && s.blocks.length > 0) {
      text += `\n📋 *PLAN DE TRABAJO:*\n`;
      s.blocks.forEach((b, idx) => {
        const exName = Array.isArray(b.exercises) ? b.exercises.join(' + ') : (b.exercises || 'Ejercicio');
        text += `\n*Bloque ${idx + 1}:* ${exName}\n`;
        if (b.sets || b.reps) text += `• Series y Reps: ${b.sets || 3}x${b.reps || 5}\n`;
        if (b.intensity) text += `• Intensidad / Carga: ${b.intensity}\n`;
        if (b.velocityTarget) text += `• Objetivo VBT: > ${b.velocityTarget} m/s\n`;
      });
    }

    if (s.notes) {
      text += `\n💬 *Indicaciones:* ${s.notes}\n`;
    }

    text += `\n_Generado con Máxima Potencia Suite_ 🚀`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (isCreating || editingSession) {
    return (
      <SessionEditor 
        sessionToEdit={editingSession}
        onBack={() => {
          setIsCreating(false);
          setEditingSession(null);
        }} 
      />
    );
  }

  const sortedSessions = [...sessions].sort((a, b) => {
    const da = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
    const db = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
    return db - da;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Sesiones de Entrenamiento</h3>
          <p className="text-xs text-slate-400 mt-0.5">Historial y planificación de entrenamientos</p>
        </div>
        <button
          onClick={() => {
            setEditingSession(null);
            setIsCreating(true);
          }}
          className="self-start sm:self-auto flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl shadow-lg shadow-red-900/30 transition-colors shrink-0 active:scale-95"
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingSession(s)}
                        className="text-slate-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Modificar sesión"
                      >
                        <Edit3 className="w-4 h-4 text-amber-400" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('¿Seguro que deseas eliminar esta sesión?')) {
                            deleteSession(s.id);
                          }
                        }}
                        className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Eliminar sesión"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-lg font-bold text-white mb-2">
                    {s.title || 'Sesión de Equipo'}
                  </p>

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
                          • {Array.isArray(b.exercises) ? b.exercises.join(' + ') : b.exercises}
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

                {/* Pie de tarjeta con WhatsApp y Modificar */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleShareWhatsApp(s)}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition-all active:scale-95"
                    title="Compartir resumen por WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => setEditingSession(s)}
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3.5 py-1.5 rounded-xl transition-all active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modificar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
