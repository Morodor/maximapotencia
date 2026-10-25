// src/components/analysis/AnalysisView.jsx
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BarChart2, 
  Activity, 
  TrendingUp, 
  Users, 
  Zap, 
  Target, 
  Award, 
  Sliders, 
  HelpCircle,
  ArrowUpRight,
  Info,
  ChevronDown,
  ChevronUp,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Flame,
  Calculator
} from 'lucide-react';
import { VBTChart } from '../charts/VBTChart';
import { ProgressLineChart } from '../charts/ProgressLineChart';
import { TeamLeaderboardChart } from '../charts/TeamLeaderboardChart';
import { 
  calculateVBTRegression, 
  getMVTForExercise, 
  getVelocityZone, 
  VELOCITY_ZONES,
  isSameExercise,
  calculateSayersPeakPower,
  calculateHarmanPeakPower,
  calculateElasticityIndex,
  calculateSubmaximal1RM,
  generateScientificDiagnostic
} from '../../utils/vbtAnalysis';

export const AnalysisView = () => {
  const { athletes, groups, getAthleteGroups, rmRecords, powerRecords, exercises } = useApp();

  const [selectedProfile, setSelectedProfile] = useState('carga-velocidad'); // 'carga-velocidad' | 'salto-potencia' | 'progreso-historico' | 'comparacion-records'
  const [selectedAthleteId, setSelectedAthleteId] = useState(athletes[0]?.id || '');
  const [selectedExercise, setSelectedExercise] = useState('Sentadilla (Squat)');
  const [customMVT, setCustomMVT] = useState('');
  const [targetVelocity, setTargetVelocity] = useState('0.80');
  const [leaderboardGroupFilter, setLeaderboardGroupFilter] = useState('all');
  const [showFormulas, setShowFormulas] = useState(false);

  // Lista de todos los ejercicios únicos
  const allExercises = useMemo(() => {
    const list = Object.values(exercises).flat().map(e => e.name);
    return Array.from(new Set(list)).sort();
  }, [exercises]);

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);
  const athleteWeight = selectedAthlete?.weight || 75;

  // MVT científico recomendado o personalizado por el usuario
  const effectiveMVT = useMemo(() => {
    const custom = parseFloat(customMVT);
    if (!isNaN(custom) && custom > 0) return custom;
    return getMVTForExercise(selectedExercise);
  }, [selectedExercise, customMVT]);

  // Historial del ejercicio seleccionado para el atleta
  const athleteHistory = useMemo(() => {
    return rmRecords
      .filter(r => (!selectedAthleteId || r.userId === selectedAthleteId) && isSameExercise(r.exercise, selectedExercise))
      .sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
        const db = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
        return da - db;
      });
  }, [rmRecords, selectedAthleteId, selectedExercise]);

  // 1RM Real histórico registrado
  const real1RM = useMemo(() => {
    if (athleteHistory.length === 0) return null;
    return Math.max(...athleteHistory.map(h => h.weight || 0));
  }, [athleteHistory]);

  // Puntos VBT medidos para el atleta y ejercicio
  const vbtPoints = useMemo(() => {
    return powerRecords
      .filter(p => {
        const matchUser = !selectedAthleteId || p.userId === selectedAthleteId;
        const matchExercise = !selectedExercise || isSameExercise(p.exercise, selectedExercise);
        const hasLoadVel = (p.load || p.weight) && p.velocity;
        return matchUser && matchExercise && hasLoadVel;
      })
      .map(p => ({
        id: p.id,
        load: parseFloat(p.load || p.weight),
        velocity: parseFloat(p.velocity),
        date: p.date
      }))
      .sort((a, b) => a.load - b.load);
  }, [powerRecords, selectedAthleteId, selectedExercise]);

  // Cálculo de Regresión Lineal VBT
  const regression = useMemo(() => {
    return calculateVBTRegression(vbtPoints, effectiveMVT);
  }, [vbtPoints, effectiveMVT]);

  // Diagnóstico Científico Automatizado (AI Coach)
  const diagnostic = useMemo(() => {
    return generateScientificDiagnostic({
      regression,
      real1RM,
      athlete: selectedAthlete,
      exerciseName: selectedExercise
    });
  }, [regression, real1RM, selectedAthlete, selectedExercise]);

  // Carga recomendada para una velocidad objetivo (Simulador VBT)
  const simulatedLoad = useMemo(() => {
    if (!regression.valid || regression.slope >= 0) return null;
    const targetV = parseFloat(targetVelocity);
    if (isNaN(targetV) || targetV <= 0) return null;
    // V = slope * L + intercept  =>  L = (V - intercept) / slope
    const load = (targetV - regression.intercept) / regression.slope;
    return load > 0 ? Math.round(load * 10) / 10 : null;
  }, [regression, targetVelocity]);

  // ---------------- DATOS DE SALTOS Y POTENCIA ----------------
  const jumpRecords = useMemo(() => {
    return powerRecords
      .filter(p => {
        const matchUser = !selectedAthleteId || p.userId === selectedAthleteId;
        const isJump = (p.exercise || '').toLowerCase().includes('salto') || 
                       (p.exercise || '').toLowerCase().includes('cmj') || 
                       (p.exercise || '').toLowerCase().includes('sj') || 
                       (p.exercise || '').toLowerCase().includes('abalakov') ||
                       (p.category || '').toLowerCase().includes('balístico');
        return matchUser && isJump && (p.distance || p.load || p.velocity);
      })
      .sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
        const db = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
        return db - da;
      });
  }, [powerRecords, selectedAthleteId]);

  const bestCMJ = useMemo(() => {
    const list = jumpRecords.filter(j => (j.exercise || '').toLowerCase().includes('cmj') || (j.exercise || '').toLowerCase().includes('salto'));
    return list.reduce((max, j) => Math.max(max, j.distance || 0), 0);
  }, [jumpRecords]);

  const bestSJ = useMemo(() => {
    const list = jumpRecords.filter(j => (j.exercise || '').toLowerCase().includes('sj'));
    return list.reduce((max, j) => Math.max(max, j.distance || 0), 0);
  }, [jumpRecords]);

  const sayersPower = useMemo(() => calculateSayersPeakPower(bestCMJ, athleteWeight), [bestCMJ, athleteWeight]);
  const harmanPower = useMemo(() => calculateHarmanPeakPower(bestCMJ, athleteWeight), [bestCMJ, athleteWeight]);
  const relSayersPower = athleteWeight > 0 && sayersPower > 0 ? (sayersPower / athleteWeight).toFixed(1) : '-';
  const elasticityIndex = useMemo(() => calculateElasticityIndex(bestCMJ, bestSJ), [bestCMJ, bestSJ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl">
        
        {/* Cabecera del Centro de Análisis */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-red-950/40">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Centro de Análisis y VBT Científico</h3>
                <p className="text-xs text-slate-400">
                  Modelos de regresión lineal, estimación de 1RM sin fatiga y biomecánica neuromuscular.
                </p>
              </div>
            </div>
          </div>

          {/* Selector de Pestaña Principal */}
          <div className="flex flex-wrap p-1 bg-slate-950 rounded-2xl border border-slate-800">
            {[
              { id: 'carga-velocidad', name: 'Perfil VBT (F-V)', icon: Activity },
              { id: 'salto-potencia', name: 'Potencia & Salto (Bosco)', icon: Zap },
              { id: 'progreso-historico', name: 'Progresión 1RM', icon: TrendingUp },
              { id: 'comparacion-records', name: 'Ranking de Equipo', icon: Users },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = selectedProfile === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedProfile(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtros Globales (Atleta & Ejercicio) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Atleta
            </label>
            <select
              value={selectedAthleteId}
              onChange={e => setSelectedAthleteId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Todos los Atletas (Equipo)</option>
              {athletes.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Ejercicio Analizado
            </label>
            <select
              value={selectedExercise}
              onChange={e => {
                setSelectedExercise(e.target.value);
                setCustomMVT('');
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {allExercises.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </div>

          {selectedProfile === 'carga-velocidad' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Umbral 1RM (MVT)
                </label>
                <span className="text-[10px] text-slate-400">Teórico: {getMVTForExercise(selectedExercise)} m/s</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.10"
                max="1.00"
                placeholder={`Recomendado: ${getMVTForExercise(selectedExercise)} m/s`}
                value={customMVT}
                onChange={e => setCustomMVT(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}
        </div>

        {/* ---------------- PESTAÑA 1: VBT CIENTÍFICO ---------------- */}
        {selectedProfile === 'carga-velocidad' && (
          <div className="space-y-6">
            
            {/* KPI Cards VBT */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1RM Estimado por Velocidad */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/70 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">1RM Estimado (VBT)</span>
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl lg:text-3xl font-black font-mono text-emerald-400">
                  {regression.valid && regression.estimated1RM ? `${regression.estimated1RM} kg` : '--'}
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  {real1RM && regression.estimated1RM ? (
                    <span className={regression.estimated1RM >= real1RM ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                      {regression.estimated1RM >= real1RM ? '▲ +' : '▼ '}
                      {(regression.estimated1RM - real1RM).toFixed(1)} kg vs. 1RM registrado ({real1RM} kg)
                    </span>
                  ) : (
                    <span>A velocidad MVT ({effectiveMVT} m/s)</span>
                  )}
                </div>
              </div>

              {/* Ajuste R² (Bondad de Ajuste) */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/70 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Calidad Perfil (R²)</span>
                  <Award className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl lg:text-3xl font-black font-mono text-white flex items-baseline gap-1.5">
                  <span>{regression.valid ? `${regression.r2Percentage}%` : '--'}</span>
                  {regression.valid && (
                    <span className="text-xs text-slate-400 font-normal">({regression.r2})</span>
                  )}
                </div>
                <p className="mt-2 text-[11px] font-medium text-slate-400 truncate">
                  {regression.valid ? regression.quality : 'Requiere al menos 2 cargas'}
                </p>
              </div>

              {/* Pendiente de la Recta */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/70 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pendiente (m)</span>
                  <TrendingUp className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-2xl lg:text-3xl font-black font-mono text-white">
                  {regression.valid ? `${regression.slope}` : '--'}
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Caída de velocidad por cada kg</p>
              </div>

              {/* Series Medidas */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/70 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Series VBT Validadas</span>
                  <Activity className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl lg:text-3xl font-black font-mono text-white">
                  {vbtPoints.length}
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Puntos en la curva actual</p>
              </div>
            </div>

            {/* 🧠 Tarjeta de Diagnóstico Científico & Recomendaciones (Coach Intelligence) */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center font-bold">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Diagnóstico Biomecánico & Prescripción Científica</span>
                      <span 
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
                        style={{ color: diagnostic.color, borderColor: `${diagnostic.color}40`, backgroundColor: `${diagnostic.color}15` }}
                      >
                        {diagnostic.headline}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Evaluación heurística basada en la pendiente de la recta, R² y estado de fatiga diaria.
                    </p>
                  </div>
                </div>
              </div>

              {diagnostic.hasData ? (
                <div className="space-y-3.5 text-xs">
                  {/* Comentario de Pendiente */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-300 block mb-1">
                      📊 Análisis del Perfil Fuerza-Velocidad:
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {diagnostic.profileComment}
                    </p>
                  </div>

                  {/* Comentario de R² y Consistencia */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-300 block mb-1">
                      🎯 Calidad Metrológica del Test:
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {diagnostic.r2Comment}
                    </p>
                  </div>

                  {/* Estado de Preparación / Fatiga */}
                  {diagnostic.readinessComment && (
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                      <span className="text-[11px] font-bold text-slate-300 block mb-1">
                        ⚡ Estado Diario de Recuperación / Fatiga:
                      </span>
                      <p className="text-slate-300 leading-relaxed">
                        {diagnostic.readinessComment}
                      </p>
                    </div>
                  )}

                  {/* Recomendaciones de Prescripción */}
                  {diagnostic.recommendations && diagnostic.recommendations.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-red-500/5 border border-red-500/20">
                      <span className="text-[11px] font-bold text-red-400 flex items-center gap-1.5 mb-2">
                        <Flame className="w-3.5 h-3.5" />
                        <span>Prescripción Recomendada para la Próxima Sesión:</span>
                      </span>
                      <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                        {diagnostic.recommendations.map((rec, i) => (
                          <li key={i} className="leading-relaxed">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  {diagnostic.summary}
                </div>
              )}
            </div>

            {/* Gráfico Interactivo VBT */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-red-500" />
                    <span>Curva Carga-Velocidad y Recta de Regresión Lineal</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedAthlete ? selectedAthlete.name : 'Equipo'} • {selectedExercise}
                  </p>
                </div>
                {regression.valid && (
                  <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono font-semibold text-slate-300">
                    Ecuación: V = {regression.slope} · Carga + {regression.intercept}
                  </span>
                )}
              </div>

              <VBTChart regressionData={regression} exerciseName={selectedExercise} />
            </div>

            {/* 📐 Fórmulas Matemáticas y Fundamento Científico (Desplegable Didáctico) */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowFormulas(!showFormulas)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span>Fórmulas Matemáticas y Fundamento Científico Utilizado</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                  <span>{showFormulas ? 'Ocultar' : 'Ver Fórmulas y Cálculos'}</span>
                  {showFormulas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {showFormulas && (
                <div className="p-5 border-t border-slate-800 space-y-4 text-xs text-slate-300 bg-slate-950/90">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fórmula 1: Regresión Lineal */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                      <p className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                        1. Modelo Lineal Carga-Velocidad (González-Badillo, 2010):
                      </p>
                      <div className="p-2.5 rounded-lg bg-black/40 font-mono text-sky-400 text-center font-bold text-sm">
                        V = m · L + c
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Donde <strong>V</strong> es la velocidad media concéntrica (m/s), <strong>L</strong> es la carga (kg), <strong>m</strong> es la pendiente ({regression.slope || 'm'}) y <strong>c</strong> la velocidad a carga cero ({regression.intercept || 'c'} m/s).
                      </p>
                    </div>

                    {/* Fórmula 2: Estimación de 1RM */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                      <p className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        2. Estimación de 1RM por Umbral Mínimo (MVT):
                      </p>
                      <div className="p-2.5 rounded-lg bg-black/40 font-mono text-emerald-400 text-center font-bold text-sm">
                        1RM = (MVT - c) / m
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Para <strong>{selectedExercise}</strong>, el MVT estándar es <strong>{effectiveMVT} m/s</strong>. Sustituyendo: 
                        {regression.valid && regression.estimated1RM ? (
                          <span className="font-mono text-emerald-300 ml-1">
                            ({effectiveMVT} - {regression.intercept}) / ({regression.slope}) = <strong>{regression.estimated1RM} kg</strong>
                          </span>
                        ) : (
                          ' (Se calcula automáticamente al registrar al menos 2 cargas distintas).'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Coeficiente R² */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                    <strong className="text-white">Coeficiente de Determinación (R² = {regression.r2 || '0'}):</strong> Representa el porcentaje de variabilidad de la velocidad explicado por la carga. En la ciencia deportiva, valores de R² ≥ 0.95 se consideran estándar de oro de confiabilidad.
                  </div>
                </div>
              )}
            </div>

            {/* Simulador de Cargas por Zona VBT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calculadora Inversa: ¿Cuánto peso poner para entrenar a X velocidad? */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 font-bold mb-2 text-sm">
                    <Target className="w-4 h-4" />
                    <span>Simulador de Prescripción VBT</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Introduce la velocidad deseada de la serie para calcular el peso exacto a colocar hoy en la barra.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase">
                        Velocidad Objetivo (m/s)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.2"
                        max="1.5"
                        value={targetVelocity}
                        onChange={e => setTargetVelocity(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                      <span className="text-[11px] text-slate-400 font-medium block">Carga Teórica Recomendada:</span>
                      <div className="text-3xl font-black font-mono text-amber-400 mt-1">
                        {simulatedLoad ? `${simulatedLoad} kg` : '--'}
                      </div>
                      {simulatedLoad && regression.estimated1RM && (
                        <span className="text-[11px] text-slate-500 block mt-1">
                          (~{Math.round((simulatedLoad / regression.estimated1RM) * 100)}% del 1RM diario)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 italic">
                  💡 Autoregula el entrenamiento según el estado neuro-muscular del atleta hoy.
                </div>
              </div>

              {/* Guía Científica de Zonas de Velocidad */}
              <div className="lg:col-span-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  <span>Zonas de Velocidad y Adaptación Biológica</span>
                </h5>

                <div className="space-y-2">
                  {VELOCITY_ZONES.map(z => {
                    const isSelected = parseFloat(targetVelocity) >= z.min && parseFloat(targetVelocity) < z.max;
                    return (
                      <div
                        key={z.name}
                        onClick={() => setTargetVelocity(((z.min + z.max) / 2).toFixed(2))}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                          isSelected
                            ? 'bg-slate-800 border-amber-500/60 ring-1 ring-amber-500/40'
                            : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.color }} />
                          <span className="font-bold text-white">{z.name}</span>
                          <span className="text-slate-400 text-[11px] hidden sm:inline">• {z.desc}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-300 ml-2">
                          {z.min.toFixed(2)} - {z.max.toFixed(2)} m/s
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tabla Detallada de Mediciones Registradas */}
            {vbtPoints.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Series Registradas en el Perfil Actual
                </h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Carga (kg)</th>
                        <th className="py-2 px-3">Velocidad (m/s)</th>
                        <th className="py-2 px-3">Zona Estimada</th>
                        <th className="py-2 px-3">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {vbtPoints.map((p, idx) => {
                        const zone = getVelocityZone(p.velocity);
                        return (
                          <tr key={p.id} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3 text-slate-500 font-mono">#{idx + 1}</td>
                            <td className="py-2 px-3 font-bold font-mono text-white">{p.load} kg</td>
                            <td className="py-2 px-3 font-bold font-mono text-emerald-400">{p.velocity} m/s</td>
                            <td className="py-2 px-3">
                              {zone && (
                                <span 
                                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold border"
                                  style={{ color: zone.color, borderColor: `${zone.color}40`, backgroundColor: `${zone.color}15` }}
                                >
                                  {zone.name}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-400">
                              {p.date?.toDate ? p.date.toDate().toLocaleDateString('es-ES') : (p.date || '--')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- PESTAÑA 2: POTENCIA & SALTO VERTICAL (BOSCO / SAYERS) ---------------- */}
        {selectedProfile === 'salto-potencia' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Altura Máxima CMJ */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/70 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mejor Salto CMJ</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl lg:text-3xl font-black font-mono text-amber-400">
                  {bestCMJ > 0 ? `${bestCMJ} cm` : '--'}
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Contramovimiento (CEA)</p>
              </div>

              {/* Potencia Pico Sayers */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/70 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Potencia Pico (Sayers)</span>
                  <Flame className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-2xl lg:text-3xl font-black font-mono text-white">
                  {sayersPower > 0 ? `${sayersPower} W` : '--'}
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Fórmula Sayers et al. (1999)</p>
              </div>

              {/* Potencia Relativa */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/70 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Potencia Relativa</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl lg:text-3xl font-black font-mono text-emerald-400">
                  {relSayersPower !== '-' ? `${relSayersPower} W/kg` : '--'}
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Vatios / Peso ({athleteWeight} kg)</p>
              </div>

              {/* Índice de Elasticidad (IE) */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/70 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Índice Elástico (IE)</span>
                  <Activity className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl lg:text-3xl font-black font-mono text-sky-400">
                  {elasticityIndex !== null ? `${elasticityIndex}%` : '--'}
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Aprovechamiento CEA (Bosco)</p>
              </div>
            </div>

            {/* Diagnóstico Biomecánico de Saltos */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-amber-400" />
                <span>Análisis Neuromuscular de Potencia & Pliometría</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Evaluación CEA */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-xs font-bold text-slate-200 block mb-1">
                    🔄 Ciclo Estiramiento-Acortamiento (CEA):
                  </span>
                  {elasticityIndex !== null ? (
                    <p className="text-slate-300 leading-relaxed">
                      {elasticityIndex >= 15 ? (
                        <span className="text-emerald-400 font-semibold">
                          Excelente reutilización de energía elástica (+{elasticityIndex}% respecto a Squat Jump). El atleta posee tendones reactivos y buena tasa de desarrollo de fuerza (RFD).
                        </span>
                      ) : elasticityIndex >= 10 ? (
                        <span className="text-sky-400 font-semibold">
                          Aprovechamiento elástico adecuado (+{elasticityIndex}%). Balance armónico entre fuerza contráctil y rebote.
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold">
                          Déficit reactivo ({elasticityIndex}%). La ganancia elástica con contramovimiento es reducida. Se recomienda trabajo pliométrico (Drop Jumps y saltos al cajón reactivos).
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-slate-400 italic">
                      Registra al menos un salto CMJ y un salto SJ (Squat Jump a 90° sin contramovimiento) para calcular el Índice Elástico de Bosco.
                    </p>
                  )}
                </div>

                {/* Comparativa de Modelos de Potencia */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-xs font-bold text-slate-200 block mb-1">
                    ⚡ Comparativa Sayers vs. Harman (Watts):
                  </span>
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <p>• Sayers (1999): <strong className="text-white">{sayersPower} W</strong> ({relSayersPower} W/kg)</p>
                    <p>• Harman (1991): <strong className="text-white">{harmanPower} W</strong> ({(harmanPower / athleteWeight).toFixed(1)} W/kg)</p>
                    <p className="text-slate-500 text-[10px] pt-1">
                      Sayers es el estándar más citado internacionalmente en halterofilia y deportes de equipo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Historial de Evaluaciones de Salto */}
            {jumpRecords.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Historial de Saltos Registrados
                </h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                        <th className="py-2.5 px-3">Ejercicio</th>
                        <th className="py-2.5 px-3 text-center">Altura (cm)</th>
                        <th className="py-2.5 px-3 text-center">Potencia (W)</th>
                        <th className="py-2.5 px-3 text-center">W / kg</th>
                        <th className="py-2.5 px-3 text-right">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {jumpRecords.map((j, idx) => {
                        const h = j.distance || 0;
                        const w = calculateSayersPeakPower(h, athleteWeight);
                        return (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-bold text-white">{j.exercise}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-400">{h} cm</td>
                            <td className="py-2.5 px-3 text-center font-mono text-white">{w} W</td>
                            <td className="py-2.5 px-3 text-center font-mono text-emerald-400">
                              {(w / athleteWeight).toFixed(1)} W/kg
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-400">
                              {j.date?.toDate ? j.date.toDate().toLocaleDateString('es-ES') : (j.date || '--')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- PESTAÑA 3: PROGRESIÓN TEMPORAL 1RM ---------------- */}
        {selectedProfile === 'progreso-historico' && (
          <div className="space-y-6">
            {/* KPI Cards de Progresión */}
            {athleteHistory.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Primer Test</span>
                  <span className="text-2xl font-black font-mono text-white mt-1 block">
                    {athleteHistory[0].weight} kg
                  </span>
                </div>
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Máximo Histórico</span>
                  <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
                    {real1RM} kg
                  </span>
                </div>
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Total Tests</span>
                  <span className="text-2xl font-black font-mono text-white mt-1 block">
                    {athleteHistory.length}
                  </span>
                </div>
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Ganancia Neta</span>
                  <span className="text-2xl font-black font-mono text-red-400 mt-1 block">
                    +{(real1RM - athleteHistory[0].weight).toFixed(1)} kg
                  </span>
                </div>
              </div>
            )}

            {/* Gráfico de Líneas Interactivo */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                <span>Evolución Histórica de Carga Máxima (1RM)</span>
              </h4>
              <ProgressLineChart records={athleteHistory} exerciseName={selectedExercise} />
            </div>

            {/* Tabla Cronológica */}
            {athleteHistory.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Cronología de Evaluaciones
                </h5>
                <div className="space-y-2">
                  {athleteHistory.map((h, i) => (
                    <div key={h.id} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 transition-colors">
                      <span className="text-slate-300 font-medium">
                        Evaluación #{i + 1} • {h.date?.toDate ? h.date.toDate().toLocaleDateString('es-ES') : h.date}
                      </span>
                      <span className="font-bold font-mono text-base text-white">{h.weight} kg</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- PESTAÑA 4: RANKING DEL EQUIPO ---------------- */}
        {selectedProfile === 'comparacion-records' && (() => {
          const leaderboardAthletes = leaderboardGroupFilter === 'all'
            ? athletes
            : athletes.filter(a => {
                const gList = getAthleteGroups(a);
                return gList.some(g => g.id === leaderboardGroupFilter);
              });

          return (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>Leaderboard del Equipo en {selectedExercise}</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-medium">
                    {leaderboardAthletes.length} de {athletes.length} Atletas
                  </span>
                </div>

                {/* Filtro por Cuadrilla / Grupo */}
                {groups.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar mb-5 pb-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                      Cuadrilla:
                    </span>
                    <button
                      onClick={() => setLeaderboardGroupFilter('all')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        leaderboardGroupFilter === 'all'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Todas ({athletes.length})
                    </button>
                    {groups.map(g => {
                      const isSel = leaderboardGroupFilter === g.id;
                      const count = athletes.filter(a => {
                        const gList = getAthleteGroups(a);
                        return gList.some(grp => grp.id === g.id);
                      }).length;

                      return (
                        <button
                          key={g.id}
                          onClick={() => setLeaderboardGroupFilter(g.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                            isSel ? 'text-white' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: isSel ? g.color : 'rgba(30, 41, 59, 0.6)',
                            borderColor: isSel ? g.color : 'rgba(51, 65, 85, 0.6)',
                            color: isSel ? '#ffffff' : g.color
                          }}
                        >
                          {g.name} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}

                <TeamLeaderboardChart 
                  athletes={leaderboardAthletes} 
                  rmRecords={rmRecords} 
                  exerciseName={selectedExercise} 
                />
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
};
