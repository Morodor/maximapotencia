import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  KeyRound, 
  Check, 
  Delete, 
  Settings, 
  Crown,
  Users
} from 'lucide-react';
import { playBeep, hapticSuccess, hapticAlert } from '../../utils/feedback';

export const CoachSwitcherModal = ({ isOpen, onClose, onOpenManageCoaches }) => {
  const { coaches, currentCoach, switchCoach, verifyCoachPin, isHeadCoach, groups } = useApp();

  const [selectedCoachForPin, setSelectedCoachForPin] = useState(null);
  const [pinDigits, setPinDigits] = useState('');
  const [pinError, setPinError] = useState(false);

  if (!isOpen) return null;

  // Manejar selección de coach
  const handleSelectCoach = (coach) => {
    // Si ya es el coach activo, solo cerrar
    if (coach.id === currentCoach?.id) {
      onClose();
      return;
    }

    // Si no tiene PIN, cambiar inmediatamente
    if (!coach.pin || coach.pin === '') {
      switchCoach(coach.id);
      hapticSuccess();
      playBeep(880, 0.1);
      onClose();
      return;
    }

    // Si tiene PIN, abrir teclado numérico
    setSelectedCoachForPin(coach);
    setPinDigits('');
    setPinError(false);
  };

  // Ingresar dígito en el teclado PIN
  const handlePinDigit = (num) => {
    if (pinDigits.length >= 4) return;
    const nextPin = pinDigits + num;
    setPinDigits(nextPin);
    playBeep(520, 0.05);

    // Si completó 4 dígitos, validar automáticamente
    if (nextPin.length === 4) {
      if (verifyCoachPin(selectedCoachForPin.id, nextPin)) {
        hapticSuccess();
        playBeep(980, 0.15);
        switchCoach(selectedCoachForPin.id);
        setSelectedCoachForPin(null);
        setPinDigits('');
        onClose();
      } else {
        hapticAlert();
        playBeep(300, 0.25, 'sawtooth');
        setPinError(true);
        setTimeout(() => {
          setPinDigits('');
          setPinError(false);
        }, 800);
      }
    }
  };

  const handlePinBackspace = () => {
    setPinDigits(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ---------------- VISTA 1: LISTA DE ENTRENADORES ---------------- */}
        {!selectedCoachForPin ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-xl font-bold text-white">Cambio Rápido de Entrenador</h3>
              </div>
              <p className="text-xs text-slate-400">
                Selecciona tu perfil para trabajar con tus grupos y cuadrillas asignadas.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {coaches.map(c => {
                const isActive = c.id === currentCoach?.id;
                const isHead = c.role === 'head_coach';
                const assignedGroups = groups.filter(g => c.assignedGroupIds?.includes(g.id));

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCoach(c)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all border ${
                      isActive
                        ? 'bg-red-500/10 border-red-500/50 shadow-md shadow-red-950/30'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div 
                        className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-md shrink-0 relative"
                        style={{ backgroundColor: c.color || '#ef4444' }}
                      >
                        {c.name.charAt(0).toUpperCase()}
                        {isHead && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center shadow">
                            <Crown className="w-3 h-3 fill-current" />
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white text-sm">{c.name}</p>
                          {isActive && (
                            <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.2 rounded-full">
                              Sesión Activa
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 font-medium">
                          {c.title || (isHead ? 'Head Coach' : 'Coach de Cuadrilla')}
                        </p>

                        {/* Etiquetas de grupos asignados */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {isHead ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              👑 Todos los grupos (Acceso Total)
                            </span>
                          ) : assignedGroups.length > 0 ? (
                            assignedGroups.map(g => (
                              <span
                                key={g.id}
                                className="text-[9px] font-bold px-1.5 py-0.2 rounded border"
                                style={{
                                  backgroundColor: `${g.color}15`,
                                  color: g.color,
                                  borderColor: `${g.color}35`
                                }}
                              >
                                {g.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] font-medium text-slate-500 italic">
                              Sin grupos asignados aún
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {c.pin && c.pin !== '' && (
                        <span className="p-1.5 bg-slate-800 text-slate-400 rounded-lg border border-slate-700/60" title="Requiere PIN de 4 dígitos">
                          <KeyRound className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {isActive && (
                        <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Acciones al pie */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-500">
                Rol actual: <strong className="text-white">{isHeadCoach ? 'Head Coach (Admin)' : 'Coach de Cuadrilla'}</strong>
              </span>

              {isHeadCoach && onOpenManageCoaches && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenManageCoaches();
                  }}
                  className="flex items-center gap-1.5 text-red-400 hover:text-red-300 font-semibold"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Gestionar Equipo de Coaches</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ---------------- VISTA 2: TECLADO PIN NUMÉRICO ---------------- */
          <div className="space-y-6 text-center animate-in fade-in">
            <div className="space-y-1">
              <div 
                className="w-14 h-14 rounded-3xl mx-auto flex items-center justify-center font-black text-white text-xl shadow-xl"
                style={{ backgroundColor: selectedCoachForPin.color || '#ef4444' }}
              >
                {selectedCoachForPin.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="text-lg font-bold text-white mt-2">{selectedCoachForPin.name}</h4>
              <p className="text-xs text-slate-400">
                Introduce tu PIN de 4 dígitos para ingresar
              </p>
            </div>

            {/* Indicador de 4 puntos de PIN */}
            <div className={`flex justify-center gap-3 py-2 transition-all ${pinError ? 'animate-bounce' : ''}`}>
              {[0, 1, 2, 3].map(idx => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    pinDigits.length > idx
                      ? pinError
                        ? 'bg-red-500 border-red-500 scale-125'
                        : 'bg-emerald-400 border-emerald-400 scale-110 shadow-sm shadow-emerald-500/50'
                      : 'border-slate-600 bg-slate-800/80'
                  }`}
                />
              ))}
            </div>

            {pinError && (
              <p className="text-xs font-bold text-red-400 animate-in fade-in">
                PIN incorrecto. Inténtalo de nuevo.
              </p>
            )}

            {/* Teclado Numérico */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  type="button"
                  key={num}
                  onClick={() => handlePinDigit(num)}
                  className="h-13 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-mono font-bold text-xl rounded-2xl border border-slate-700/60 shadow-sm transition-all"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setSelectedCoachForPin(null)}
                className="h-13 bg-slate-800/40 hover:bg-slate-800 text-slate-400 font-semibold text-xs rounded-2xl border border-slate-800 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => handlePinDigit(0)}
                className="h-13 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-mono font-bold text-xl rounded-2xl border border-slate-700/60 shadow-sm transition-all"
              >
                0
              </button>

              <button
                type="button"
                onClick={handlePinBackspace}
                className="h-13 bg-slate-800/60 hover:bg-slate-700 active:scale-95 text-slate-300 flex items-center justify-center rounded-2xl border border-slate-700/60 transition-all"
                title="Borrar dígito"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
