import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, X, Volume2, VolumeX, Maximize2, Minimize2, Plus, Minus } from 'lucide-react';
import { playTimerFinishBeep, playBeep, hapticTap, hapticAlert } from '../../utils/feedback';

export const FloatingTimer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [initialSeconds, setInitialSeconds] = useState(90);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [justFinished, setJustFinished] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setJustFinished(true);
            if (soundEnabled) playTimerFinishBeep();
            hapticAlert();
            return 0;
          }
          if (prev <= 4 && soundEnabled) {
            playBeep(440, 0.08); // countdown tick
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft, soundEnabled]);

  const startPreset = (secs) => {
    hapticTap();
    setInitialSeconds(secs);
    setSecondsLeft(secs);
    setIsRunning(true);
    setJustFinished(false);
    setIsMinimized(true);
  };

  const toggleRun = () => {
    hapticTap();
    if (secondsLeft === 0) {
      setSecondsLeft(initialSeconds);
      setJustFinished(false);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    hapticTap();
    setIsRunning(false);
    setSecondsLeft(initialSeconds);
    setJustFinished(false);
  };

  const adjustTime = (delta) => {
    hapticTap();
    setSecondsLeft(prev => Math.max(5, prev + delta));
    setInitialSeconds(prev => Math.max(5, prev + delta));
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const progressPercent = initialSeconds > 0 
    ? ((initialSeconds - secondsLeft) / initialSeconds) * 100 
    : 0;

  // Floating Minimized Button
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 lg:bottom-6 right-4 z-40">
        <button
          onClick={() => { hapticTap(); setIsMinimized(false); }}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-2xl border transition-all duration-200 transform hover:scale-105 active:scale-95 ${
            justFinished
              ? 'bg-emerald-600 text-white border-emerald-400 animate-bounce'
              : isRunning
              ? 'bg-slate-900/95 text-red-400 border-red-500/60 ring-2 ring-red-500/30'
              : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:border-slate-600'
          }`}
        >
          <Timer className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          <span className="font-mono font-bold text-sm tracking-tight text-white">
            {justFinished ? '¡TIEMPO!' : formatTime(secondsLeft)}
          </span>
          {isRunning && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </button>
      </div>
    );
  }

  // Expanded Overlay Modal / Card
  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl p-5 text-white animate-in fade-in zoom-in-95">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center">
            <Timer className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Descanso de Serie</h4>
            <span className="text-[10px] text-slate-400 font-medium">Timer de entrenamiento</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors ${!soundEnabled ? 'text-slate-600' : ''}`}
            title={soundEnabled ? 'Silenciar' : 'Activar sonido'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
          <button
            onClick={() => { hapticTap(); setIsMinimized(true); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Minimizar"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Digital Display & Ring */}
      <div className="py-6 text-center relative flex flex-col items-center justify-center">
        {justFinished ? (
          <div className="animate-bounce my-2">
            <span className="text-3xl font-black text-emerald-400 tracking-wider">¡A LA BARRA!</span>
            <p className="text-xs text-emerald-300/80 mt-1 font-medium">Descanso completado. ¡Siguiente serie!</p>
          </div>
        ) : (
          <>
            <div className="font-mono text-5xl font-black text-white tracking-tight flex items-center justify-center gap-3">
              <span>{formatTime(secondsLeft)}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </>
        )}

        {/* Adjust +/- 15s */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => adjustTime(-15)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
          >
            <Minus className="w-3 h-3" /> 15s
          </button>
          <button
            onClick={() => adjustTime(15)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
          >
            <Plus className="w-3 h-3" /> 15s
          </button>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <button
          onClick={resetTimer}
          className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Reiniciar"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={toggleRun}
          className={`flex-1 py-3 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/30'
              : 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/30'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              <span>Pausar</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>{secondsLeft === 0 ? 'Reiniciar' : 'Iniciar'}</span>
            </>
          )}
        </button>
      </div>

      {/* Presets Grid */}
      <div className="pt-3 border-t border-slate-800">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
          Presets Rápidos
        </span>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '45s', secs: 45 },
            { label: '90s', secs: 90 },
            { label: '2m', secs: 120 },
            { label: '3m', secs: 180 },
          ].map(p => (
            <button
              key={p.secs}
              onClick={() => startPreset(p.secs)}
              className="py-1.5 rounded-xl bg-slate-800/80 hover:bg-red-600/30 hover:border-red-500/50 border border-slate-700/60 text-xs font-semibold text-slate-300 hover:text-white transition-all text-center"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
