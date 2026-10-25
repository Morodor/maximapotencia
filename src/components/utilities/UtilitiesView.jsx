import React, { useState, useEffect } from 'react';
import { Percent, Disc3, Timer, Target, Play, Pause, RotateCcw } from 'lucide-react';
import { PlateVisualizer } from '../common/PlateVisualizer';

export const UtilitiesView = () => {
  const [activeTab, setActiveTab] = useState('calculators');

  // Estado Calculadora de Porcentajes
  const [percRM, setPercRM] = useState('140');

  // Estado Calculadora de Discos
  const [barWeight, setBarWeight] = useState(20);
  const [targetWeight, setTargetWeight] = useState('100');
  const [discResult, setDiscResult] = useState([]);

  // Estado Cronómetro
  const [timeLeft, setTimeLeft] = useState(120);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Formato mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calcular discos por lado
  const calculateDiscs = () => {
    const total = parseFloat(targetWeight);
    if (!total || total <= barWeight) {
      setDiscResult([]);
      return;
    }
    let weightPerSide = (total - barWeight) / 2;
    const availablePlates = [25, 20, 15, 10, 5, 2.5, 2, 1.5, 1, 0.5];
    const platesUsed = [];

    for (const plate of availablePlates) {
      while (weightPerSide >= plate) {
        platesUsed.push(plate);
        weightPerSide = Math.round((weightPerSide - plate) * 100) / 100;
      }
    }
    setDiscResult(platesUsed);
  };

  // Tabla de porcentajes de 50% a 100%
  const percentages = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Selector de sub-pestañas */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('calculators')}
          className={`py-2 px-4 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'calculators' 
              ? 'bg-red-600 text-white' 
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          Calculadoras y Timer
        </button>
        <button
          onClick={() => setActiveTab('vbt')}
          className={`py-2 px-4 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'vbt' 
              ? 'bg-red-600 text-white' 
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          Prescriptor Zonas VBT
        </button>
      </div>

      {activeTab === 'calculators' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Calculadora de Porcentajes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center gap-2.5 text-blue-400 font-bold mb-3">
                <Percent className="w-5 h-5" />
                <h4 className="text-white text-base">Tabla de Porcentajes</h4>
              </div>
              <p className="text-xs text-slate-400 mb-4">Calcula las cargas de tus series de trabajo.</p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Tu 1RM (kg)</label>
                <input
                  type="number"
                  value={percRM}
                  onChange={e => setPercRM(e.target.value)}
                  placeholder="140"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {percentages.map(pct => {
                  const val = parseFloat(percRM) || 0;
                  const kg = (val * (pct / 100)).toFixed(1);
                  return (
                    <div key={pct} className="bg-slate-800/60 p-2 rounded-lg flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold">{pct}%</span>
                      <span className="font-mono font-bold text-white">{kg} kg</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Calculadora de Discos */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center gap-2.5 text-amber-400 font-bold mb-3">
                <Disc3 className="w-5 h-5" />
                <h4 className="text-white text-base">Carga de Discos en Barra</h4>
              </div>
              <p className="text-xs text-slate-400 mb-4">Qué discos colocar por cada lado de la barra.</p>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Barra</label>
                  <select
                    value={barWeight}
                    onChange={e => setBarWeight(parseFloat(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value={20}>Olímpica 20 kg</option>
                    <option value={15}>Olímpica 15 kg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Objetivo (kg)</label>
                  <input
                    type="number"
                    value={targetWeight}
                    onChange={e => setTargetWeight(e.target.value)}
                    placeholder="100"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <PlateVisualizer targetWeight={parseFloat(targetWeight) || 20} barWeight={barWeight} />
              </div>
            </div>
          </div>

          {/* Cronómetro de Descanso */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold mb-3">
                <Timer className="w-5 h-5" />
                <h4 className="text-white text-base">Cronómetro de Descanso</h4>
              </div>
              <p className="text-xs text-slate-400 mb-4">Controla los intervalos entre series.</p>

              <div className="bg-slate-800/80 border border-slate-700/80 py-6 rounded-2xl text-center mb-4">
                <span className="text-5xl font-black font-mono text-white tracking-widest">
                  {formatTime(timeLeft)}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {[60, 90, 120, 180].map(secs => (
                  <button
                    key={secs}
                    onClick={() => {
                      setTimeLeft(secs);
                      setIsTimerRunning(false);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      timeLeft === secs ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {secs}s
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isTimerRunning
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isTimerRunning ? 'Pausar' : 'Iniciar'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimeLeft(120);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2.5 rounded-xl transition-colors"
                  title="Reiniciar"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Prescriptor VBT */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6">
          <div className="flex items-center gap-2.5 text-red-500 font-bold mb-2">
            <Target className="w-5 h-5" />
            <h4 className="text-white text-lg">Zonas de Entrenamiento Basado en Velocidad (VBT)</h4>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Rango de velocidades de ejecución medias propulsivas (m/s) y su correspondencia con la cualidad neuromuscular a desarrollar:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Fuerza Veloz (&gt; 1.3 m/s)
              </span>
              <p className="text-xs text-slate-400 leading-normal mb-2">
                Carga: 30-45% 1RM. Máxima velocidad de movimiento y aceleración balística.
              </p>
              <span className="text-[11px] text-slate-500">Ejemplos: Saltos con lastre, lanzamientos.</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                Velocidad-Fuerza (1.0 - 1.3 m/s)
              </span>
              <p className="text-xs text-slate-400 leading-normal mb-2">
                Carga: 45-60% 1RM. Pico de potencia y tasa de desarrollo de la fuerza (RFD).
              </p>
              <span className="text-[11px] text-slate-500">Ejemplos: Tirones altos, saltos con barra.</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1">
                Fuerza-Velocidad (0.75 - 1.0 m/s)
              </span>
              <p className="text-xs text-slate-400 leading-normal mb-2">
                Carga: 60-80% 1RM. Cargas moderadas movidas a máxima intención explosiva.
              </p>
              <span className="text-[11px] text-slate-500">Ejemplos: Power Clean, Push Press.</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">
                Fuerza Submáxima (0.5 - 0.75 m/s)
              </span>
              <p className="text-xs text-slate-400 leading-normal mb-2">
                Carga: 80-90% 1RM. Alta tensión mecánica y reclutamiento de unidades motoras.
              </p>
              <span className="text-[11px] text-slate-500">Ejemplos: Sentadilla pesada, Press banca.</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider block mb-1">
                Fuerza Máxima (&lt; 0.5 m/s)
              </span>
              <p className="text-xs text-slate-400 leading-normal mb-2">
                Carga: &gt; 90% 1RM. Esfuerzo máximo concéntrico límite.
              </p>
              <span className="text-[11px] text-slate-500">Ejemplos: Tests de 1RM, intentos de competición.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
