"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const DEMO_USER_ID = "demo_athlete_1";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [workoutData, setWorkoutData] = useState<any>(null);
  const [error, setError] = useState("");

  const [activePlan, setActivePlan] = useState<any>(null);
  const [timeContext, setTimeContext] = useState({ semana_actual: 1, dia_actual: 1 });

  const [athleteData, setAthleteData] = useState({
    edad: 24,
    sexo: "Hombre",
    peso_corporal: 81,
    deporte: "Halterofilia",
    rm_historico: { snatch: 110, clean_and_jerk: 140, back_squat: 180, front_squat: 145 },
    deficiencia_tecnica: {
      movimiento: "Snatch",
      fase: "Recepción (Lento bajo la barra)"
    },
    historial_lesiones: "Ninguna",
    objetivo_principal: "Fuerza Máxima Absoluta",
    frecuencia_competitiva: "Una vez al año",
    duracion_plan_meses: 3,
    dias_por_semana: 4,
    calidad_sueno: 7,
    rpe_diario: 7,
  });

  useEffect(() => {
    // Cargar plan activo al iniciar
    const fetchActivePlan = async () => {
      try {
        const docRef = doc(db, "plans", DEMO_USER_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setActivePlan(data.plan_periodizacion);
          
          // Calcular la semana y día actual basado en la fecha de inicio
          const fechaInicio = data.fecha_inicio;
          const ahora = Date.now();
          const diasTranscurridos = Math.floor((ahora - fechaInicio) / (1000 * 60 * 60 * 24));
          
          const semanaActual = Math.floor(diasTranscurridos / 7) + 1;
          const diaActual = (diasTranscurridos % 7) + 1;
          
          setTimeContext({ semana_actual: semanaActual, dia_actual: diaActual });
          
          // Almacenamos los datos para mostrarlos
          setWorkoutData({
            plan_periodizacion: data.plan_periodizacion,
            fase_actual: "Esperando generar sesión de hoy...",
          });
        }
      } catch (err) {
        console.error("Error al cargar plan de Firestore:", err);
      }
    };
    fetchActivePlan();
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setAthleteData(prev => ({ ...prev, [name]: value }));
  };

  const handleRmChange = (e: any) => {
    const { name, value } = e.target;
    setAthleteData(prev => ({
      ...prev,
      rm_historico: { ...prev.rm_historico, [name]: Number(value) }
    }));
  };

  const handleTechnicalChange = (e: any) => {
    const { name, value } = e.target;
    setAthleteData(prev => ({
      ...prev,
      deficiencia_tecnica: { ...prev.deficiencia_tecnica, [name]: value }
    }));
  };

  const handleCreateMacrocycle = async () => {
    setLoading(true); setError(""); setWorkoutData(null);
    try {
      const response = await fetch("/api/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE_MACROCYCLE", athleteData }),
      });
      if (!response.ok) throw new Error("Error al generar el Macrociclo");
      const data = await response.json();
      
      // Guardar en Firestore
      await setDoc(doc(db, "plans", DEMO_USER_ID), {
        plan_periodizacion: data.plan_periodizacion,
        fecha_inicio: Date.now(),
        athleteData_snapshot: athleteData
      });
      
      setActivePlan(data.plan_periodizacion);
      setTimeContext({ semana_actual: 1, dia_actual: 1 });
      setWorkoutData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDaily = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GENERATE_DAILY",
          athleteData,
          activePlan,
          semana_actual: timeContext.semana_actual,
          dia_actual: timeContext.dia_actual
        }),
      });
      if (!response.ok) throw new Error("Error al generar la sesión diaria");
      const data = await response.json();
      
      // Mantenemos el plan_periodizacion original en pantalla y solo actualizamos la sesión
      setWorkoutData((prev: any) => ({
        ...prev,
        fase_actual: data.fase_actual,
        sesion_diaria: data.sesion_diaria,
        ajuste_autoregulacion: data.ajuste_autoregulacion
      }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Banner de Memoria Activa */}
      {activePlan && (
        <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Macrociclo Activo Recuperado</h3>
              <p className="text-zinc-400 text-xs">El sistema detectó un plan en curso. Te encuentras en la <strong>Semana {timeContext.semana_actual}, Día {timeContext.dia_actual}</strong>.</p>
            </div>
          </div>
          <button onClick={handleGenerateDaily} disabled={loading} className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2">
            {loading ? "Calculando..." : "Generar Sesión de Hoy"}
            {!loading && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>}
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Panel de Atleta - Mega Formulario */}
        <div className="lg:col-span-5 bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-full max-h-[85vh]">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Perfil del Atleta
          </h2>
          
          <div className="space-y-6 flex-grow overflow-y-auto pr-2 custom-scrollbar">
            
            {/* Sección: Datos Base */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider border-b border-border pb-1">Biometría</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Edad</label>
                  <input type="number" name="edad" value={athleteData.edad} onChange={handleChange} className="w-full bg-background px-3 py-2 rounded-md border border-border focus:border-primary outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Peso (kg)</label>
                  <input type="number" name="peso_corporal" value={athleteData.peso_corporal} onChange={handleChange} className="w-full bg-background px-3 py-2 rounded-md border border-border focus:border-primary outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Sexo</label>
                  <select name="sexo" value={athleteData.sexo} onChange={handleChange} className="w-full bg-background px-3 py-2 rounded-md border border-border focus:border-primary outline-none text-sm">
                    <option value="Hombre">Hombre</option>
                    <option value="Mujer">Mujer</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sección: RMs */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider border-b border-border pb-1">Métricas (1RM en kg)</h3>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Snatch</label>
                  <input type="number" name="snatch" value={athleteData.rm_historico.snatch} onChange={handleRmChange} className="w-full bg-background px-2 py-2 rounded-md border border-border focus:border-primary outline-none text-sm text-center font-bold text-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">C&J</label>
                  <input type="number" name="clean_and_jerk" value={athleteData.rm_historico.clean_and_jerk} onChange={handleRmChange} className="w-full bg-background px-2 py-2 rounded-md border border-border focus:border-primary outline-none text-sm text-center font-bold text-orange-400" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">B. Squat</label>
                  <input type="number" name="back_squat" value={athleteData.rm_historico.back_squat} onChange={handleRmChange} className="w-full bg-background px-2 py-2 rounded-md border border-border focus:border-primary outline-none text-sm text-center font-bold text-red-500" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">F. Squat</label>
                  <input type="number" name="front_squat" value={athleteData.rm_historico.front_squat} onChange={handleRmChange} className="w-full bg-background px-2 py-2 rounded-md border border-border focus:border-primary outline-none text-sm text-center font-bold text-purple-400" />
                </div>
              </div>
            </div>

            {/* Sección: Macrociclo */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider border-b border-border pb-1">Periodización (Macrociclo)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Duración del Plan</label>
                  <select name="duracion_plan_meses" value={athleteData.duracion_plan_meses} onChange={handleChange} className="w-full bg-background px-3 py-2 rounded-md border border-border focus:border-primary outline-none text-sm">
                    <option value="3">3 Meses</option>
                    <option value="4">4 Meses</option>
                    <option value="5">5 Meses</option>
                    <option value="6">6 Meses</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Días por semana</label>
                  <select name="dias_por_semana" value={athleteData.dias_por_semana} onChange={handleChange} className="w-full bg-background px-3 py-2 rounded-md border border-border focus:border-primary outline-none text-sm">
                    <option value="2">2 Días</option>
                    <option value="3">3 Días</option>
                    <option value="4">4 Días</option>
                    <option value="5">5 Días</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Objetivo Principal</label>
                <select name="objetivo_principal" value={athleteData.objetivo_principal} onChange={handleChange} className="w-full bg-background px-3 py-2 rounded-md border border-border focus:border-primary outline-none text-sm">
                  <option value="Fuerza Máxima Absoluta">Fuerza Máxima Absoluta</option>
                  <option value="Mejorar Potencia Explosiva (RFD)">Mejorar Potencia Explosiva (RFD)</option>
                  <option value="Perfeccionar Técnica de Snatch">Perfeccionar Técnica de Snatch</option>
                  <option value="Perfeccionar Técnica de C&J">Perfeccionar Técnica de C&J</option>
                  <option value="Acondicionamiento / Salud">Acondicionamiento / Salud general</option>
                </select>
              </div>
            </div>

            {/* Sección: Contexto Técnico / Clínico */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider border-b border-border pb-1">Técnica y Salud</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Movimiento a Corregir</label>
                  <select name="movimiento" value={athleteData.deficiencia_tecnica.movimiento} onChange={handleTechnicalChange} className="w-full bg-background px-3 py-2 rounded-md border border-border focus:border-primary outline-none text-sm">
                    <option value="Ninguno">Ninguno</option>
                    <option value="Snatch">Snatch (Arranque)</option>
                    <option value="Clean">Clean (Cargada)</option>
                    <option value="Jerk">Jerk (Envión)</option>
                    <option value="Sentadilla">Sentadilla (Squat)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Fase Deficiente</label>
                  <select name="fase" value={athleteData.deficiencia_tecnica.fase} onChange={handleTechnicalChange} className="w-full bg-background px-3 py-2 rounded-md border border-border focus:border-primary outline-none text-sm disabled:opacity-50" disabled={athleteData.deficiencia_tecnica.movimiento === "Ninguno"}>
                    {athleteData.deficiencia_tecnica.movimiento === "Jerk" ? (
                      <>
                        <option value="Dip & Drive (Poco empuje)">Dip & Drive (Poco empuje)</option>
                        <option value="Split (Caída inestable/lenta)">Split (Caída inestable/lenta)</option>
                        <option value="Overhead (Falta de bloqueo)">Overhead (Falta de bloqueo)</option>
                      </>
                    ) : athleteData.deficiencia_tecnica.movimiento === "Sentadilla" ? (
                      <>
                        <option value="Profundidad (Poca profundidad o rebote débil)">Profundidad (Poca profundidad o rebote débil)</option>
                        <option value="Salida (Estancamiento en el fondo/hoyo)">Salida (Estancamiento en el fondo/hoyo)</option>
                        <option value="Postura (Caída del pecho / Dorso redondeado)">Postura (Caída del pecho / Dorso redondeado)</option>
                      </>
                    ) : (
                      <>
                        <option value="Despegue (Primer tirón débil)">Despegue (Primer tirón débil)</option>
                        <option value="Extensión (Segundo tirón incompleto)">Extensión (Segundo tirón incompleto)</option>
                        <option value="Metida (Jalón anticipado / Early pull)">Metida (Jalón anticipado / Early pull)</option>
                        <option value="Recepción (Lento bajo la barra)">Recepción (Lento bajo la barra)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Historial de Lesiones / Restricciones</label>
                <input type="text" name="historial_lesiones" value={athleteData.historial_lesiones} onChange={handleChange} className="w-full bg-background px-3 py-2 rounded-md border border-border focus:border-primary outline-none text-sm" placeholder="Ej: Dolor rodilla derecha..." />
              </div>
            </div>

            {/* Sección: Feedback Diario (Autoregulación) */}
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-4">
              <div>
                <label className="text-sm font-bold text-white block mb-2 flex justify-between">
                  <span>Calidad de Sueño Anoche</span>
                  <span className="text-blue-400">{athleteData.calidad_sueno}/10</span>
                </label>
                <input type="range" min="1" max="10" name="calidad_sueno" value={athleteData.calidad_sueno} onChange={handleChange} className="w-full accent-blue-400" />
              </div>
              <div>
                <label className="text-sm font-bold text-white block mb-2 flex justify-between">
                  <span>RPE de Sesión Anterior</span>
                  <span className="text-primary">{athleteData.rpe_diario}/10</span>
                </label>
                <input type="range" min="1" max="10" name="rpe_diario" value={athleteData.rpe_diario} onChange={handleChange} className="w-full accent-primary" />
              </div>
            </div>

          </div>

          <div className="pt-4 mt-2 border-t border-border">
            <button
              onClick={handleCreateMacrocycle}
              disabled={loading}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-zinc-700"
            >
              {loading ? "Calculando..." : (activePlan ? "Sobrescribir con Nuevo Plan (Resetea progreso)" : "Crear Nuevo Macrociclo")}
            </button>
            {error && <p className="text-red-500 text-sm text-center mt-3">{error}</p>}
          </div>
        </div>

        {/* Visualizador de Sesión y Macrociclo */}
        <div className="lg:col-span-7 bg-card border border-border rounded-xl p-6 shadow-sm min-h-[600px] max-h-[85vh] flex flex-col overflow-y-auto custom-scrollbar">
          {!workoutData && !loading && (
            <div className="flex-grow flex flex-col items-center justify-center text-zinc-500 space-y-4 py-12">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
              </div>
              <p className="text-center max-w-sm">
                Ajusta el contexto y presiona "Crear Nuevo Macrociclo". Si ya tienes uno, usa el banner superior para generar solo la sesión de hoy.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex-grow flex flex-col items-center justify-center space-y-6 py-12">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-zinc-800 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-primary text-xs font-bold">IA</span>
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-zinc-300 font-medium animate-pulse">Consultando a Gemini 2.5 Pro...</p>
                <p className="text-zinc-500 text-xs">Evaluando deficiencias y RPE para prescribir carga óptima...</p>
              </div>
            </div>
          )}

          {workoutData && !loading && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* PLAN DE PERIODIZACIÓN (MACROCICLO) */}
              {workoutData.plan_periodizacion && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                    Plan de Periodización ({workoutData.plan_periodizacion.duracion_total})
                  </h2>
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {workoutData.plan_periodizacion.distribucion_mesociclos?.map((meso: any, idx: number) => (
                      <div key={idx} className="min-w-[200px] flex-shrink-0 bg-black/40 border border-zinc-700/50 rounded-lg p-3">
                        <p className="text-primary font-bold text-sm mb-1">{meso.nombre}</p>
                        <p className="text-xs text-zinc-300 font-medium">{meso.objetivo}</p>
                        <div className="mt-2 flex justify-between text-[10px] text-zinc-500 font-mono">
                          <span>{meso.duracion_semanas} Semanas</span>
                          <span>{meso.sesiones_por_semana} Días/sem</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SESIÓN DE HOY */}
              {workoutData.sesion_diaria && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                      Sesión de Entrenamiento
                    </h2>
                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/30">
                      {workoutData.fase_actual}
                    </span>
                  </div>

                  {/* Autoregulación Badge */}
                  {workoutData.ajuste_autoregulacion && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex flex-col mb-4">
                      <p className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        Autoregulación Activa
                      </p>
                      <p className="text-sm text-yellow-500/90 leading-tight">{workoutData.ajuste_autoregulacion}</p>
                    </div>
                  )}

                  {/* Zonas de Entrenamiento */}
                  <div className="space-y-4">
                    {/* Zona Balística */}
                    {workoutData.sesion_diaria.zona_balistica && workoutData.sesion_diaria.zona_balistica.length > 0 && (
                      <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl overflow-hidden">
                        <div className="bg-blue-900/20 px-4 py-2 border-b border-blue-900/30 flex items-center gap-2">
                          <span className="text-blue-400 text-lg">⚡</span>
                          <h3 className="font-bold text-blue-100 uppercase text-sm tracking-wider">Potencia Pura (SNC)</h3>
                        </div>
                        <div className="p-4 space-y-3">
                          {workoutData.sesion_diaria.zona_balistica.map((ex: any, idx: number) => (
                            <div key={idx} className="bg-black/40 p-3 rounded-lg border border-white/5 flex justify-between items-center group hover:border-blue-500/30 transition-colors">
                              <div>
                                <p className="font-medium text-white">{ex.ejercicio}</p>
                                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-md">Intensidad: {ex.intensidad}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-black text-white">{ex.series} <span className="text-zinc-500 text-sm font-medium">x</span> {ex.repeticiones}</p>
                                <p className="text-xs text-blue-300 flex items-center justify-end gap-1 mt-1">
                                  ⏱️ {ex.descanso_segundos}s
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Zona DLP */}
                    {workoutData.sesion_diaria.zona_dlp && workoutData.sesion_diaria.zona_dlp.length > 0 && (
                      <div className="bg-orange-950/20 border border-orange-900/30 rounded-xl overflow-hidden">
                        <div className="bg-orange-900/20 px-4 py-2 border-b border-orange-900/30 flex items-center gap-2">
                          <span className="text-orange-400 text-lg">🚀</span>
                          <h3 className="font-bold text-orange-100 uppercase text-sm tracking-wider">Velocidad (DLP)</h3>
                        </div>
                        <div className="p-4 space-y-3">
                          {workoutData.sesion_diaria.zona_dlp.map((ex: any, idx: number) => (
                            <div key={idx} className="bg-black/40 p-3 rounded-lg border border-white/5 flex justify-between items-center group hover:border-orange-500/30 transition-colors">
                              <div>
                                <p className="font-medium text-white">{ex.ejercicio}</p>
                                <span className="inline-block mt-1 px-2 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded-md font-mono">{ex.porcentaje_rm}% RM</span>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-black text-white">{ex.series} <span className="text-zinc-500 text-sm font-medium">x</span> {ex.repeticiones}</p>
                                <p className="text-xs text-orange-300 flex items-center justify-end gap-1 mt-1">
                                  ⏱️ {ex.descanso_segundos}s
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Zona Fuerza */}
                    {workoutData.sesion_diaria.zona_fuerza && workoutData.sesion_diaria.zona_fuerza.length > 0 && (
                      <div className="bg-red-950/20 border border-red-900/30 rounded-xl overflow-hidden">
                        <div className="bg-red-900/20 px-4 py-2 border-b border-red-900/30 flex items-center gap-2">
                          <span className="text-red-500 text-lg">🧱</span>
                          <h3 className="font-bold text-red-100 uppercase text-sm tracking-wider">Fuerza Máxima</h3>
                        </div>
                        <div className="p-4 space-y-3">
                          {workoutData.sesion_diaria.zona_fuerza.map((ex: any, idx: number) => (
                            <div key={idx} className="bg-black/40 p-3 rounded-lg border border-white/5 flex justify-between items-center group hover:border-red-500/30 transition-colors">
                              <div>
                                <p className="font-medium text-white">{ex.ejercicio}</p>
                                <span className="inline-block mt-1 px-2 py-0.5 bg-red-500/20 text-red-300 text-xs rounded-md font-mono">{ex.porcentaje_rm}% RM</span>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-black text-white">{ex.series} <span className="text-zinc-500 text-sm font-medium">x</span> {ex.repeticiones}</p>
                                <p className="text-xs text-red-300 flex items-center justify-end gap-1 mt-1">
                                  ⏱️ {ex.descanso_segundos}s
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Zona Correctiva (NUEVO) */}
                    {workoutData.sesion_diaria.zona_correctiva && workoutData.sesion_diaria.zona_correctiva.length > 0 && (
                      <div className="bg-purple-950/20 border border-purple-900/30 rounded-xl overflow-hidden">
                        <div className="bg-purple-900/20 px-4 py-2 border-b border-purple-900/30 flex items-center gap-2">
                          <span className="text-purple-400 text-lg">🔧</span>
                          <h3 className="font-bold text-purple-100 uppercase text-sm tracking-wider">Asistencia Correctiva</h3>
                        </div>
                        <div className="p-4 space-y-3">
                          {workoutData.sesion_diaria.zona_correctiva.map((ex: any, idx: number) => (
                            <div key={idx} className="bg-black/40 p-3 rounded-lg border border-white/5 flex flex-col justify-between group hover:border-purple-500/30 transition-colors gap-2">
                              <div className="flex justify-between items-center">
                                <p className="font-medium text-white">{ex.ejercicio}</p>
                                <p className="text-lg font-black text-white">{ex.series} <span className="text-zinc-500 text-sm font-medium">x</span> {ex.repeticiones}</p>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="inline-block px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-md">Objetivo: {ex.proposito}</span>
                                <p className="text-xs text-purple-300 flex items-center justify-end gap-1">
                                  ⏱️ {ex.descanso_segundos}s
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
