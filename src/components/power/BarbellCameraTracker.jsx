import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Camera, 
  CameraOff, 
  Play, 
  Square, 
  RotateCcw, 
  Save, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Zap, 
  Target, 
  Ruler, 
  CheckCircle2, 
  RefreshCw,
  Sparkles,
  Info,
  Dumbbell,
  ArrowUpRight,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { getVelocityZone } from '../../utils/vbtAnalysis';
import { playBeep, hapticSuccess, hapticAlert } from '../../utils/feedback';

export const BarbellCameraTracker = ({ onRecordSaved }) => {
  const { athletes, groups, getAthleteGroups, exercises, addPowerRecord } = useApp();

  // Selector Principal de Modo: 'barbell' (Velocidad VBT) | 'jump' (Altura CMJ)
  const [trackerMode, setTrackerMode] = useState('barbell');

  // Cuadrilla / Grupo activo en plataforma
  const [selectedGroup, setSelectedGroup] = useState('all');

  // Atletas disponibles según grupo
  const availableAthletes = selectedGroup === 'all' 
    ? athletes 
    : athletes.filter(a => {
        const gList = getAthleteGroups(a);
        return gList.some(g => g.id === selectedGroup);
      });

  // Estados de configuración de la serie
  const [selectedAthlete, setSelectedAthlete] = useState(athletes[0]?.id || '');
  const [selectedExercise, setSelectedExercise] = useState('Sentadilla (Squat)');
  const [load, setLoad] = useState('100'); // kg
  const [voiceFeedback, setVoiceFeedback] = useState(true);

  // Rotar al siguiente atleta de la cuadrilla en la plataforma
  const handleNextAthlete = () => {
    if (availableAthletes.length <= 1) return;
    const currentIndex = availableAthletes.findIndex(a => a.id === selectedAthlete);
    const nextIndex = (currentIndex + 1) % availableAthletes.length;
    setSelectedAthlete(availableAthletes[nextIndex].id);
    playBeep(700, 0.08);
  };

  // Estados específicos de Salto
  const [jumpMethod, setJumpMethod] = useState('flight-time'); // 'flight-time' | 'hip-tracking'
  const [jumpPhase, setJumpPhase] = useState('ready'); // 'ready' | 'in-air' | 'landed'
  const [takeoffTime, setTakeoffTime] = useState(null);

  // Estados de la cámara y rastreador
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' o 'user'
  const [cameraError, setCameraError] = useState(null);

  // Calibración de escala (Diámetro disco olímpico = 45 cm)
  const [calibrationDiameter, setCalibrationDiameter] = useState(160); // píxeles en pantalla
  const [showCalibrationGuide, setShowCalibrationGuide] = useState(true);

  // Estado de tracking
  const [trackingState, setTrackingState] = useState('idle'); // 'idle' | 'ready' | 'tracking' | 'finished'
  const [trackedPoint, setTrackedPoint] = useState(null); // { x, y }

  // Métricas medidas
  const [measuredData, setMeasuredData] = useState(null);
  const [instantVelocity, setInstantVelocity] = useState(0);

  // Referencias a elementos DOM y streams
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Historial de trayectoria en memoria
  const trajectoryRef = useRef([]); // [{ x, y, t }]
  const stateRef = useRef({
    trackerMode: 'barbell',
    trackingState: 'idle',
    trackedPoint: null,
    calibrationDiameter: 160,
    minY: null,
    maxY: null
  });

  // Mantener stateRef sincronizado
  useEffect(() => {
    stateRef.current.trackerMode = trackerMode;
    stateRef.current.trackingState = trackingState;
    stateRef.current.trackedPoint = trackedPoint;
    stateRef.current.calibrationDiameter = calibrationDiameter;
  }, [trackerMode, trackingState, trackedPoint, calibrationDiameter]);

  // Lista de ejercicios según el modo
  const barbellExercises = [
    ...(exercises['Ley de Hill (Fuerza)'] || []).map(e => e.name),
    ...(exercises['DLP (Derivados del Levantamiento Olímpico)'] || []).map(e => e.name)
  ].sort();

  const jumpExercises = [
    'Salto CMJ (Countermovement Jump)',
    'Salto Abalakov (con brazos)',
    'Squat Jump (SJ - Salto estático)',
    'Drop Jump (DJ - Salto reactivo)',
    ...(exercises['Balístico Explosivo'] || []).map(e => e.name)
  ].filter((v, i, a) => a.indexOf(v) === i).sort();

  // Cambiar de modo Barra <-> Salto
  const handleModeChange = (newMode) => {
    setTrackerMode(newMode);
    setMeasuredData(null);
    setTrackedPoint(null);
    trajectoryRef.current = [];
    setJumpPhase('ready');
    setTakeoffTime(null);

    if (newMode === 'barbell') {
      setSelectedExercise(barbellExercises[0] || 'Sentadilla (Squat)');
      setLoad('100');
    } else {
      setSelectedExercise(jumpExercises[0] || 'Salto CMJ (Countermovement Jump)');
      setLoad('0'); // Peso corporal
    }
  };

  // Iniciar cámara web / móvil con fallback de constraints
  const startCamera = async (facing = cameraFacing) => {
    setCameraError(null);
    setIsLoadingCamera(true);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (errConstraint) {
        console.warn('Fallo con constraints óptimos, reintentando básico:', errConstraint);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false
        });
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        try {
          await video.play();
        } catch (playErr) {
          console.warn('Video play error:', playErr);
        }
      }

      setIsCameraActive(true);
      setTrackingState('ready');
      startTrackingLoop();
    } catch (err) {
      console.error('Error accediendo a la cámara:', err);
      setCameraError(
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
          ? 'Permiso denegado: por favor autoriza el acceso a la cámara en los permisos de tu dispositivo.'
          : 'No se pudo acceder a la cámara. Comprueba que ninguna otra aplicación la esté utilizando.'
      );
      setIsCameraActive(false);
    } finally {
      setIsLoadingCamera(false);
    }
  };

  // Detener cámara
  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setTrackingState('idle');
  };

  const toggleCameraFacing = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (isCameraActive) {
      await startCamera(nextFacing);
    }
  };

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Click o Tap en el canvas para fijar punto de seguimiento (compatible con móvil)
  const handleCanvasClick = (e) => {
    if (!canvasRef.current || !videoRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const clientX = e.clientX ?? (e.touches?.[0]?.clientX ?? e.changedTouches?.[0]?.clientX);
    const clientY = e.clientY ?? (e.touches?.[0]?.clientY ?? e.changedTouches?.[0]?.clientY);
    if (clientX === undefined || clientY === undefined) return;

    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const clickX = (clientX - rect.left) * scaleX;
    const clickY = (clientY - rect.top) * scaleY;

    const newPoint = { x: clickX, y: clickY };
    setTrackedPoint(newPoint);
    trajectoryRef.current = [{ x: clickX, y: clickY, t: performance.now() }];
    setMeasuredData(null);
    setTrackingState('ready');
    playBeep(660, 0.1);
  };

  // Iniciar serie de barra
  const startBarbellLift = () => {
    if (!trackedPoint) {
      alert('Toca primero el centro del disco o la barra en la pantalla.');
      return;
    }

    trajectoryRef.current = [{ ...trackedPoint, t: performance.now() }];
    setMeasuredData(null);
    setTrackingState('tracking');
    playBeep(880, 0.15);
  };

  // Finalizar serie de barra
  const finishBarbellLift = useCallback(() => {
    setTrackingState('finished');
    const samples = trajectoryRef.current;
    if (samples.length < 5) return;

    const pxPerCm = stateRef.current.calibrationDiameter / 45.0;

    let lowestIdx = 0;
    let maxYVal = -Infinity;
    for (let i = 0; i < samples.length; i++) {
      if (samples[i].y > maxYVal) {
        maxYVal = samples[i].y;
        lowestIdx = i;
      }
    }

    let highestIdx = lowestIdx;
    let minYVal = Infinity;
    for (let i = lowestIdx; i < samples.length; i++) {
      if (samples[i].y < minYVal) {
        minYVal = samples[i].y;
        highestIdx = i;
      }
    }

    const startSample = samples[lowestIdx];
    const endSample = samples[highestIdx];

    const displacementPx = Math.abs(startSample.y - endSample.y);
    const displacementCm = displacementPx / pxPerCm;
    const durationSeconds = Math.max(0.15, (endSample.t - startSample.t) / 1000.0);

    const displacementMeters = displacementCm / 100.0;
    const meanVelocity = Math.round((displacementMeters / durationSeconds) * 100) / 100;

    let peakV = 0;
    for (let i = lowestIdx + 1; i <= highestIdx; i++) {
      const dt = (samples[i].t - samples[i - 1].t) / 1000.0;
      if (dt > 0.01) {
        const dy = (samples[i - 1].y - samples[i].y) / pxPerCm / 100.0;
        const instV = dy / dt;
        if (instV > peakV) peakV = instV;
      }
    }
    peakV = Math.round(Math.max(meanVelocity * 1.15, peakV) * 100) / 100;

    const results = {
      type: 'barbell',
      meanVelocity: Math.max(0.10, Math.min(2.5, meanVelocity)),
      peakVelocity: Math.max(0.15, Math.min(3.5, peakV)),
      romCm: Math.round(displacementCm * 10) / 10,
      durationSeconds: Math.round(durationSeconds * 100) / 100,
      date: new Date().toISOString().split('T')[0]
    };

    setMeasuredData(results);
    hapticSuccess();

    if (voiceFeedback && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const msg = new SpeechSynthesisUtterance(`${results.meanVelocity} metros por segundo`);
        msg.lang = 'es-ES';
        msg.rate = 1.05;
        window.speechSynthesis.speak(msg);
      } catch (e) {}
    }
  }, [voiceFeedback]);

  // ---------------- LÓGICA DE SALTO (TIEMPO DE VUELO CIENTÍFICO) ----------------
  // Fórmula: Altura (cm) = 1/8 * g * (t_vuelo)^2 * 100 = 122.625 * t^2
  const handleJumpTakeoff = () => {
    const t = performance.now();
    setTakeoffTime(t);
    setJumpPhase('in-air');
    playBeep(920, 0.1, 'triangle');
  };

  const handleJumpLanding = () => {
    if (!takeoffTime) return;
    const landing = performance.now();
    const flightTimeMs = landing - takeoffTime;
    const flightTimeSec = flightTimeMs / 1000.0;

    // Calcular altura en cm con la fórmula científica de MyJump / Bosco
    // h = 122.625 * t^2
    const heightCm = Math.round(122.625 * (flightTimeSec * flightTimeSec) * 10) / 10;

    // Velocidad de despegue (v = g * t / 2)
    const takeoffVelocity = Math.round(((9.81 * flightTimeSec) / 2) * 100) / 100;

    const results = {
      type: 'jump',
      heightCm: Math.max(5, Math.min(95, heightCm)),
      flightTimeMs: Math.round(flightTimeMs),
      takeoffVelocity,
      date: new Date().toISOString().split('T')[0]
    };

    setMeasuredData(results);
    setJumpPhase('landed');
    setTakeoffTime(null);
    hapticSuccess();
    playBeep(1200, 0.25, 'triangle');

    if (voiceFeedback && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const msg = new SpeechSynthesisUtterance(`${results.heightCm} centímetros`);
        msg.lang = 'es-ES';
        msg.rate = 1.05;
        window.speechSynthesis.speak(msg);
      } catch (e) {}
    }
  };

  const resetJump = () => {
    setJumpPhase('ready');
    setTakeoffTime(null);
    setMeasuredData(null);
  };

  // Bucle de Renderizado y Seguimiento (Canvas 60fps)
  const startTrackingLoop = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && (video.readyState >= 2 || video.videoWidth > 0)) {
        const ctx = canvas.getContext('2d');
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const currentPt = stateRef.current.trackedPoint;
        const curState = stateRef.current.trackingState;
        const calDiam = stateRef.current.calibrationDiameter;
        const mode = stateRef.current.trackerMode;

        // Guía de Calibración (solo en modo Barra)
        if (mode === 'barbell' && showCalibrationGuide && currentPt) {
          ctx.beginPath();
          ctx.arc(currentPt.x, currentPt.y, calDiam / 2, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#eab308';
          ctx.font = 'bold 12px Inter, sans-serif';
          ctx.fillText('Disco Olímpico (45 cm)', currentPt.x - 65, currentPt.y - (calDiam / 2) - 8);
        }

        // Seguimiento y Trayectoria
        if (curState === 'tracking' && currentPt) {
          const now = performance.now();
          const lastSample = trajectoryRef.current[trajectoryRef.current.length - 1];

          let nextY = currentPt.y;
          let nextX = currentPt.x;

          trajectoryRef.current.push({ x: nextX, y: nextY, t: now });

          if (lastSample && now - lastSample.t > 30) {
            const dt = (now - lastSample.t) / 1000.0;
            const pxPerCm = calDiam / 45.0;
            const dyM = ((lastSample.y - nextY) / pxPerCm) / 100.0;
            const instV = Math.max(0, dyM / dt);
            setInstantVelocity(Math.round(instV * 100) / 100);
          }
        }

        // Dibujar Trayectoria Neón
        const traj = trajectoryRef.current;
        if (traj.length > 1) {
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          for (let i = 1; i < traj.length; i++) {
            ctx.beginPath();
            ctx.moveTo(traj[i - 1].x, traj[i - 1].y);
            ctx.lineTo(traj[i].x, traj[i].y);

            const isMovingUp = traj[i].y < traj[i - 1].y;
            ctx.strokeStyle = isMovingUp ? '#10b981' : '#ef4444';
            ctx.shadowColor = isMovingUp ? '#10b981' : '#ef4444';
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }

        // Marcador del punto
        if (currentPt) {
          ctx.beginPath();
          ctx.arc(currentPt.x, currentPt.y, 14, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(currentPt.x, currentPt.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = curState === 'tracking' ? '#ef4444' : '#38bdf8';
          ctx.fill();
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
  };

  // Guardar en Firestore
  const saveToFirebase = async () => {
    if (!measuredData || !selectedAthlete || !selectedExercise) return;

    let payload = null;

    if (measuredData.type === 'barbell') {
      payload = {
        userId: selectedAthlete,
        exercise: selectedExercise,
        category: 'VBT Barra (Cámara)',
        load: parseFloat(load) || 0,
        velocity: measuredData.meanVelocity,
        distance: measuredData.romCm,
        date: measuredData.date,
        notes: `VBT Cam • Pico: ${measuredData.peakVelocity} m/s • Tiempo: ${measuredData.durationSeconds}s`
      };
    } else {
      payload = {
        userId: selectedAthlete,
        exercise: selectedExercise,
        category: 'Salto Vertical (Cámara)',
        load: parseFloat(load) || null,
        distance: measuredData.heightCm,
        velocity: measuredData.takeoffVelocity,
        date: measuredData.date,
        notes: `Salto Cam • Tiempo vuelo: ${measuredData.flightTimeMs} ms • V. Despegue: ${measuredData.takeoffVelocity} m/s`
      };
    }

    const ok = await addPowerRecord(payload);
    if (ok) {
      hapticSuccess();
      playBeep(1100, 0.25);
      if (onRecordSaved) onRecordSaved(payload);
    }
  };

  return (
    <div className="space-y-6">
      {/* Video off-screen permanentemente montado en el DOM para alimentar el canvas sin ser pausado por el SO */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{
          position: 'fixed',
          top: -9999,
          left: -9999,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none'
        }}
      />

      {/* Selector Principal de Modo: Barra vs. Salto */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
            Modo de Medición Óptica
          </span>
          <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              onClick={() => handleModeChange('barbell')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                trackerMode === 'barbell'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>🏋️ Medir Barra (Velocidad VBT)</span>
            </button>

            <button
              onClick={() => handleModeChange('jump')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                trackerMode === 'jump'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>🦘 Medir Salto (Altura CMJ)</span>
            </button>
          </div>
        </div>

        {/* Botones de Cámara y Voz */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setVoiceFeedback(!voiceFeedback)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              voiceFeedback
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Voz de resultados"
          >
            {voiceFeedback ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">Voz {voiceFeedback ? 'Activa' : 'Muda'}</span>
          </button>

          {!isCameraActive ? (
            <button
              onClick={() => startCamera()}
              disabled={isLoadingCamera}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-red-950/40 transition-all active:scale-95"
            >
              {isLoadingCamera ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Iniciando...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Activar Cámara</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleCameraFacing}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
                title="Cambiar cámara (frontal/trasera)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={stopCamera}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-red-400 text-xs font-semibold transition-colors"
              >
                <CameraOff className="w-4 h-4" />
                <span>Apagar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inputs de Serie: Atleta, Ejercicio, Carga */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        {/* Selector de Cuadrilla y Rotación Rápida */}
        {groups.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                Cuadrilla:
              </span>
              <button
                type="button"
                onClick={() => setSelectedGroup('all')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                  selectedGroup === 'all'
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                Todas ({athletes.length})
              </button>
              {groups.map(g => (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => {
                    setSelectedGroup(g.id);
                    const members = athletes.filter(a => (a.groupIds && a.groupIds.includes(g.id)) || (g.athleteIds && g.athleteIds.includes(a.id)));
                    if (members.length > 0) setSelectedAthlete(members[0].id);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                    selectedGroup === g.id
                      ? 'text-white'
                      : 'hover:border-slate-600 opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: selectedGroup === g.id ? g.color : 'rgba(30, 41, 59, 0.6)',
                    borderColor: selectedGroup === g.id ? g.color : 'rgba(51, 65, 85, 0.6)',
                    color: selectedGroup === g.id ? '#ffffff' : g.color
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedGroup === g.id ? '#fff' : g.color }} />
                  <span>{g.name}</span>
                </button>
              ))}
            </div>

            {availableAthletes.length > 1 && (
              <button
                type="button"
                onClick={handleNextAthlete}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 active:scale-95 transition-all"
                title="Rotar al siguiente atleta de la cuadrilla en la barra"
              >
                <span>Siguiente Atleta ⏭️</span>
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">
              Atleta
            </label>
            <select
              value={selectedAthlete}
              onChange={e => setSelectedAthlete(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {availableAthletes.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">
              {trackerMode === 'barbell' ? 'Ejercicio con Barra' : 'Tipo de Salto'}
            </label>
            <select
              value={selectedExercise}
              onChange={e => setSelectedExercise(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {(trackerMode === 'barbell' ? barbellExercises : jumpExercises).map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">
              {trackerMode === 'barbell' ? 'Carga en Barra (kg)' : 'Lastre Adicional (opcional kg)'}
            </label>
            <input
              type="number"
              step="0.5"
              value={load}
              onChange={e => setLoad(e.target.value)}
              placeholder={trackerMode === 'barbell' ? '100' : '0 (Peso corporal)'}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* Visor de Cámara y Controles de Medición */}
      {isCameraActive ? (
        <div className="relative bg-black rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col items-center">
          <canvas
            ref={canvasRef}
            onClick={trackerMode === 'barbell' ? handleCanvasClick : undefined}
            onTouchStart={trackerMode === 'barbell' ? handleCanvasClick : undefined}
            className={`w-full h-auto max-h-[520px] object-contain touch-none select-none ${
              trackerMode === 'barbell' ? 'cursor-crosshair' : ''
            }`}
          />

          {/* Overlay Superior */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-700/80 text-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="font-bold text-white font-mono uppercase tracking-wider">
                {trackerMode === 'barbell'
                  ? (trackingState === 'tracking' ? 'Grabando Barra' : 'Cámara Activa')
                  : (jumpPhase === 'in-air' ? '¡EN EL AIRE!' : 'Listo para el Salto')}
              </span>
            </div>

            {trackerMode === 'barbell' && trackingState === 'tracking' && (
              <div className="bg-slate-950/90 backdrop-blur px-4 py-2 rounded-2xl border border-red-500/50 text-right shadow-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Velocidad Instantánea</span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {instantVelocity} m/s
                </span>
              </div>
            )}
          </div>

          {/* ---------------- CONTROLES INFERIORES: MODO BARRA ---------------- */}
          {trackerMode === 'barbell' && (
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 bg-slate-950/85 backdrop-blur-md p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1 font-semibold text-[11px] text-amber-400">
                  <Ruler className="w-3.5 h-3.5" /> Calibrar 45cm:
                </span>
                <input
                  type="range"
                  min="60"
                  max="320"
                  value={calibrationDiameter}
                  onChange={e => setCalibrationDiameter(parseInt(e.target.value, 10))}
                  className="w-24 sm:w-36 accent-amber-500 cursor-pointer"
                />
                <button
                  onClick={() => setShowCalibrationGuide(!showCalibrationGuide)}
                  className={`text-[11px] px-2 py-0.5 rounded border ${
                    showCalibrationGuide ? 'border-amber-500/60 text-amber-400' : 'border-slate-700 text-slate-500'
                  }`}
                >
                  Guía
                </button>
              </div>

              <div className="flex items-center gap-2">
                {trackingState !== 'tracking' ? (
                  <button
                    onClick={startBarbellLift}
                    disabled={!trackedPoint}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-red-950/40 transition-all active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Iniciar Serie</span>
                  </button>
                ) : (
                  <button
                    onClick={finishBarbellLift}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all active:scale-95 animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Completar Serie</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setTrackedPoint(null);
                    trajectoryRef.current = [];
                    setMeasuredData(null);
                    setTrackingState('ready');
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Reiniciar punto"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ---------------- CONTROLES INFERIORES: MODO SALTO ---------------- */}
          {trackerMode === 'jump' && (
            <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/90 backdrop-blur-md p-4 rounded-3xl border border-amber-500/40 shadow-2xl">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Cronómetro Óptico de Vuelo (Fórmula MyJump: h = 122.6 · t²)
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  {jumpPhase === 'ready' && 'Enfoca los pies del atleta. Cuando salte, pulsa "Marcar Despegue".'}
                  {jumpPhase === 'in-air' && 'El atleta está en el aire. En cuanto toque el piso, pulsa "Marcar Aterrizaje".'}
                  {jumpPhase === 'landed' && '¡Salto registrado! Revisa los resultados abajo.'}
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {jumpPhase === 'ready' && (
                  <button
                    onClick={handleJumpTakeoff}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm shadow-xl shadow-amber-950/50 transition-all active:scale-95"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>🚀 MARCAR DESPEGUE</span>
                  </button>
                )}

                {jumpPhase === 'in-air' && (
                  <button
                    onClick={handleJumpLanding}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-950/50 transition-all active:scale-95 animate-bounce"
                  >
                    <Square className="w-5 h-5 fill-current" />
                    <span>🛬 MARCAR ATERRIZAJE</span>
                  </button>
                )}

                {jumpPhase === 'landed' && (
                  <button
                    onClick={resetJump}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Otro Salto</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Tarjeta cuando la cámara está apagada */
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl p-10 text-center space-y-5">
          {cameraError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-start sm:items-center justify-between gap-3 text-xs text-left max-w-lg mx-auto animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
                <div>
                  <p className="font-bold text-white">No se pudo activar la cámara</p>
                  <p className="text-slate-300 text-[11px] mt-0.5">{cameraError}</p>
                </div>
              </div>
              <button
                onClick={() => startCamera()}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shrink-0 transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}

          <div className="w-16 h-16 rounded-3xl bg-red-600/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-inner">
            <Camera className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-base font-bold text-white">
              {trackerMode === 'barbell' ? 'Rastreador de Barra Óptico (VBT)' : 'Medidor de Salto Vertical por Cámara (CMJ)'}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {trackerMode === 'barbell'
                ? 'Coloca la cámara de costado mirando a la barra, presiona Activar Cámara y toca el disco olímpico.'
                : 'Enfoca al atleta de cuerpo completo o sus pies para registrar el tiempo de vuelo y calcular la altura exacta del salto.'}
            </p>
          </div>
          <button
            onClick={() => startCamera()}
            disabled={isLoadingCamera}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-red-950/40 transition-all active:scale-95"
          >
            {isLoadingCamera ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Conectando Cámara...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Encender Cámara Ahora</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Resultados Medidos */}
      {measuredData && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <h4 className="text-base font-bold text-white">
                  {measuredData.type === 'barbell' ? 'Serie de Barra Registrada' : 'Salto Vertical Evaluado'}
                </h4>
                <p className="text-xs text-slate-400">
                  {selectedExercise} • {athletes.find(a => a.id === selectedAthlete)?.name}
                </p>
              </div>
            </div>

            <button
              onClick={saveToFirebase}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Guardar en Perfil del Atleta</span>
            </button>
          </div>

          {/* Tarjetas según el modo */}
          {measuredData.type === 'barbell' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Velocidad Media
                </span>
                <span className="text-3xl font-black font-mono text-emerald-400 mt-1 block">
                  {measuredData.meanVelocity} m/s
                </span>
                {(() => {
                  const z = getVelocityZone(measuredData.meanVelocity);
                  if (!z) return null;
                  return (
                    <span 
                      className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold border"
                      style={{ color: z.color, borderColor: `${z.color}40`, backgroundColor: `${z.color}15` }}
                    >
                      {z.name}
                    </span>
                  );
                })()}
              </div>

              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Velocidad Pico
                </span>
                <span className="text-3xl font-black font-mono text-white mt-1 block">
                  {measuredData.peakVelocity} m/s
                </span>
                <span className="text-[11px] text-slate-400 mt-2 block">Aceleración máxima</span>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Rango (ROM)
                </span>
                <span className="text-3xl font-black font-mono text-white mt-1 block">
                  {measuredData.romCm} cm
                </span>
                <span className="text-[11px] text-slate-400 mt-2 block">Recorrido vertical</span>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Tiempo Concéntrico
                </span>
                <span className="text-3xl font-black font-mono text-white mt-1 block">
                  {measuredData.durationSeconds} s
                </span>
                <span className="text-[11px] text-slate-400 mt-2 block">Duración del empuje</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/80 p-5 rounded-2xl border border-amber-500/40 text-center">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                  Altura de Salto
                </span>
                <span className="text-4xl font-black font-mono text-amber-400 mt-1 block">
                  {measuredData.heightCm} cm
                </span>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {measuredData.heightCm >= 45 ? 'Nivel Excelente / Élite' : measuredData.heightCm >= 35 ? 'Nivel Bueno' : 'Nivel Medio'}
                </span>
              </div>

              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Tiempo de Vuelo
                </span>
                <span className="text-4xl font-black font-mono text-white mt-1 block">
                  {measuredData.flightTimeMs} ms
                </span>
                <span className="text-[11px] text-slate-400 mt-2 block">Duración en el aire</span>
              </div>

              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Velocidad de Despegue
                </span>
                <span className="text-4xl font-black font-mono text-emerald-400 mt-1 block">
                  {measuredData.takeoffVelocity} m/s
                </span>
                <span className="text-[11px] text-slate-400 mt-2 block">Aceleración inicial</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
