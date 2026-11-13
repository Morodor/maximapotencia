/**
 * Motor Matemático y Científico VBT (Velocity Based Training)
 * & Análisis de Potencia Neuromuscular y Saltos
 * Basado en investigaciones de:
 * - González-Badillo, Sánchez-Medina (2010): Perfiles Carga-Velocidad y MVT
 * - Jovanovic & Flanagan (2014): Aplicación práctica del VBT
 * - Sayers et al. (1999) & Harman et al. (1991): Estimación de Potencia Pico en Saltos
 * - Bosco et al. (1983): Índice de Utilización Elástica (CEA)
 * - Epley (1985), Brzycki (1993), Lander (1985): Modelos submáximos de 1RM
 */

// Normalizador de nombres de ejercicios para comparaciones seguras
export const isSameExercise = (ex1, ex2) => {
  if (!ex1 || !ex2) return false;
  if (ex1 === ex2) return true;
  const clean = s => s.toLowerCase()
    .replace(/\s*\([^)]*\)/g, '') // Quita paréntesis ej. (Squat), (Bench Press)
    .trim();
  const c1 = clean(ex1);
  const c2 = clean(ex2);
  return c1 === c2 || c1.includes(c2) || c2.includes(c1);
};

// Umbrales de Velocidad Mínima (MVT o V1RM) según literatura científica (en m/s)
export const EXERCISE_MVT = {
  // Tren Inferior
  'Sentadilla (Squat)': 0.30,
  'Sentadilla': 0.30,
  'Sentadilla Trasera (Back Squat)': 0.30,
  'Sentadilla Anterior (Front Squat)': 0.30,
  'Sentadilla Frontal (Front Squat)': 0.30,
  'Sentadillas Búlgaras (Bulgarian Split Squats)': 0.35,
  'Hip Thrust': 0.25,

  // Tren Superior Empuje
  'Press Banca (Bench Press)': 0.17,
  'Press de Banca (Bench Press)': 0.17,
  'Press Banca': 0.17,
  'Press Militar (Military Press)': 0.19,
  'Press Militar (Overhead Press)': 0.19,
  'Press Militar': 0.19,
  'Push Press': 0.45,

  // Cadena Posterior / Tracción
  'Peso Muerto (Deadlift)': 0.15,
  'Peso Muerto': 0.15,
  'Peso Muerto Rumano (Romanian Deadlift)': 0.20,
  'Peso Muerto Rumano': 0.20,
  'Remo con Barra (Barbell Row)': 0.25,
  'Remo con Barra': 0.25,
  'Dominadas (Pull-ups)': 0.20,
  'Dominadas': 0.20,

  // Derivados Halterofilia & DLP
  'Arranque (Snatch)': 0.85,
  'Arranque Colgante (Hang Snatch)': 0.80,
  'Arranque de Potencia (Power Snatch)': 0.80,
  'Arranque de Potencia Colgante (Hang Power Snatch)': 0.80,
  'Arranque de Fuerza (Muscle Snatch)': 0.85,
  'Cargada (Clean)': 0.80,
  'Cargada Colgante (Hang Clean)': 0.75,
  'Cargada de Potencia (Power Clean)': 0.75,
  'Cargada de Potencia Colgante (Hang Power Clean)': 0.75,
  'Cargada de Fuerza (Muscle Clean)': 0.75,
  'Envión (Jerk)': 0.75,
  'Push Jerk': 0.70,
  'Split Jerk': 0.75,
  'Power Jerk': 0.75,
  'Push Press': 0.40,
  'Push Press tras Nuca (Behind the Neck Push Press)': 0.40,
  'Envión tras Nuca (Behind the Neck Jerk)': 0.75,
  'Sentadilla de Arranque (Overhead Squat)': 0.35,
  'Balance de Arranque (Snatch Balance)': 0.80,
  'Tirones de Arranque (Snatch Pulls)': 0.65,
  'Tirón de Arranque (Snatch Pull)': 0.65,
  'Tirón Alto de Arranque (Snatch High Pull)': 0.70,
  'Tirones de Cargada (Clean Pulls)': 0.60,
  'Tirón de Envión (Clean Pull)': 0.60,
  'Tirón Alto de Cargada (Clean High Pull)': 0.65,

  // Complexes / Combinados (DLP)
  'Cargada y Envión (Clean & Jerk)': 0.80,
  'Clean & Jerk': 0.80,
  'Complex: Cargada + Sentadilla Frontal + Envión (Clean + Front Squat + Jerk)': 0.75,
  'Complex: Cargada de Potencia + Push Press (Power Clean + Push Press)': 0.65,
  'Complex: Cargada de Potencia + Push Jerk (Power Clean + Push Jerk)': 0.75,
  'Complex: Cargada de Potencia + Sentadilla Frontal (Power Clean + Front Squat)': 0.60,
  'Complex: Tirón de Cargada + Cargada de Potencia (Clean Pull + Power Clean)': 0.70,
  'Complex: Tirón de Cargada + Cargada Colgante (Clean Pull + Hang Clean)': 0.70,
  'Complex: Cargada Colgante + Cargada (Hang Clean + Clean)': 0.75,
  'Complex: Arranque de Potencia + Sentadilla de Arranque (Power Snatch + Overhead Squat)': 0.70,
  'Complex: Tirón de Arranque + Arranque de Potencia (Snatch Pull + Power Snatch)': 0.75,
  'Complex: Tirón de Arranque + Arranque Colgante (Snatch Pull + Hang Snatch)': 0.75,
  'Complex: Arranque Colgante + Arranque (Hang Snatch + Snatch)': 0.80,
  'Complex: Push Press + Split Jerk': 0.60,
  'Complex: Sentadilla Frontal + Push Press (Thruster / Front Squat + Push Press)': 0.40,
  'Complex: Peso Muerto Rumano + Remo con Barra (RDL + Barbell Row)': 0.25,

  // Default de seguridad si no está en la lista
  'DEFAULT': 0.25
};

export const getMVTForExercise = (exerciseName = '') => {
  if (!exerciseName) return EXERCISE_MVT['DEFAULT'];
  const match = Object.keys(EXERCISE_MVT).find(k => isSameExercise(k, exerciseName));
  if (match) return EXERCISE_MVT[match];
  if (exerciseName.toLowerCase().startsWith('complex:')) return 0.70;
  return EXERCISE_MVT['DEFAULT'];
};

/**
 * Zonas de Velocidad según objetivo neuro-muscular (González-Badillo)
 */
export const VELOCITY_ZONES = [
  { name: 'Fuerza Máxima', min: 0.0, max: 0.50, color: '#ef4444', desc: '> 85% 1RM • Tensión mecánica máxima' },
  { name: 'Fuerza-Velocidad', min: 0.50, max: 0.75, color: '#f97316', desc: '70% - 85% 1RM • Cargas altas a máxima aceleración' },
  { name: 'Potencia Máxima', min: 0.75, max: 1.00, color: '#eab308', desc: '50% - 70% 1RM • Pico de producción de potencia (Watts)' },
  { name: 'Velocidad-Fuerza', min: 1.00, max: 1.30, color: '#3b82f6', desc: '35% - 50% 1RM • Velocidad dominante con carga media-ligera' },
  { name: 'Velocidad / Balístico', min: 1.30, max: 2.50, color: '#10b981', desc: '< 35% 1RM • Máxima tasa de desarrollo de fuerza (RFD)' }
];

export const getVelocityZone = (velocity) => {
  const v = parseFloat(velocity);
  if (isNaN(v)) return null;
  return VELOCITY_ZONES.find(z => v >= z.min && v < z.max) || VELOCITY_ZONES[VELOCITY_ZONES.length - 1];
};

/**
 * Calcula la regresión lineal para pares Carga (kg) vs. Velocidad (m/s)
 * Ecuación: V = slope * Load + intercept
 * 1RM = (MVT - intercept) / slope
 */
export const calculateVBTRegression = (points, mvt = 0.30) => {
  const validPoints = (points || [])
    .map(p => ({
      load: parseFloat(p.load || p.weight || p.x),
      velocity: parseFloat(p.velocity || p.vel || p.y)
    }))
    .filter(p => !isNaN(p.load) && p.load > 0 && !isNaN(p.velocity) && p.velocity > 0);

  if (validPoints.length < 2) {
    return {
      valid: false,
      reason: 'Se necesitan al menos 2 series con cargas distintas y su velocidad media para calcular el perfil VBT.',
      pointsCount: validPoints.length
    };
  }

  const n = validPoints.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (const p of validPoints) {
    sumX += p.load;
    sumY += p.velocity;
    sumXY += p.load * p.velocity;
    sumX2 += p.load * p.load;
    sumY2 += p.velocity * p.velocity;
  }

  const denominatorX = n * sumX2 - sumX * sumX;
  if (denominatorX === 0) {
    return {
      valid: false,
      reason: 'Todas las mediciones tienen la misma carga. Prueba con al menos 2 cargas incrementales.',
      pointsCount: n
    };
  }

  const slope = (n * sumXY - sumX * sumY) / denominatorX;
  const intercept = (sumY - slope * sumX) / n;

  // Coeficiente de correlación y R²
  const denominatorY = n * sumY2 - sumY * sumY;
  const correlation = denominatorY > 0 ? (n * sumXY - sumX * sumY) / Math.sqrt(denominatorX * denominatorY) : 0;
  const r2 = Math.min(1, Math.max(0, correlation * correlation));

  let estimated1RM = null;
  if (slope < 0) {
    const raw1RM = (mvt - intercept) / slope;
    if (raw1RM > 0) {
      estimated1RM = Math.round(raw1RM * 10) / 10;
    }
  }

  // Puntos de la recta de regresión
  const minLoad = Math.max(0, Math.min(...validPoints.map(p => p.load)) * 0.8);
  const maxLoad = Math.max(estimated1RM ? estimated1RM * 1.05 : 100, Math.max(...validPoints.map(p => p.load)) * 1.15);

  const regressionLine = [
    { x: Math.round(minLoad), y: Math.max(0, Math.round((slope * minLoad + intercept) * 100) / 100) },
    { x: Math.round(estimated1RM || maxLoad), y: mvt }
  ];

  return {
    valid: true,
    pointsCount: n,
    slope: Math.round(slope * 10000) / 10000,
    intercept: Math.round(intercept * 100) / 100,
    r2: Math.round(r2 * 1000) / 1000,
    r2Percentage: Math.round(r2 * 100),
    quality: r2 >= 0.95 ? 'Excelente (Estándar Oro)' : r2 >= 0.85 ? 'Buena' : 'Moderada (Dispersión alta)',
    estimated1RM,
    mvtUsed: mvt,
    points: validPoints,
    regressionLine
  };
};

/**
 * -------------------------------------------------------------
 * FÓRMULAS DE POTENCIA Y SALTO VERTICAL (Bosco, Sayers, Harman)
 * -------------------------------------------------------------
 */

/**
 * Calcula la altura del salto vertical a partir del tiempo de vuelo (en ms o s)
 * h = (g * t^2) / 8  = 1.22625 * t^2 (m)
 */
export const calculateJumpHeightFromFlightTime = (flightTimeSeconds) => {
  const t = parseFloat(flightTimeSeconds);
  if (isNaN(t) || t <= 0) return 0;
  const heightMeters = (9.81 * Math.pow(t, 2)) / 8;
  return Math.round(heightMeters * 1000) / 10; // en cm con 1 decimal
};

/**
 * Potencia Pico en Salto Vertical (Sayers et al., 1999)
 * Peak Power (W) = 60.7 * JumpHeight(cm) + 45.3 * BodyWeight(kg) - 2055
 */
export const calculateSayersPeakPower = (jumpHeightCm, bodyWeightKg) => {
  const h = parseFloat(jumpHeightCm);
  const bw = parseFloat(bodyWeightKg);
  if (isNaN(h) || h <= 0 || isNaN(bw) || bw <= 0) return 0;
  const watts = 60.7 * h + 45.3 * bw - 2055;
  return Math.max(0, Math.round(watts));
};

/**
 * Potencia Pico en Salto Vertical (Harman et al., 1991)
 * Peak Power (W) = 61.9 * JumpHeight(cm) + 36.0 * BodyWeight(kg) + 1822
 */
export const calculateHarmanPeakPower = (jumpHeightCm, bodyWeightKg) => {
  const h = parseFloat(jumpHeightCm);
  const bw = parseFloat(bodyWeightKg);
  if (isNaN(h) || h <= 0 || isNaN(bw) || bw <= 0) return 0;
  const watts = 61.9 * h + 36.0 * bw + 1822;
  return Math.max(0, Math.round(watts));
};

/**
 * Índice de Utilización Elástica (Bosco, 1983)
 * IE (%) = ((CMJ - SJ) / SJ) * 100
 */
export const calculateElasticityIndex = (cmjHeightCm, sjHeightCm) => {
  const cmj = parseFloat(cmjHeightCm);
  const sj = parseFloat(sjHeightCm);
  if (isNaN(cmj) || cmj <= 0 || isNaN(sj) || sj <= 0) return null;
  const ie = ((cmj - sj) / sj) * 100;
  return Math.round(ie * 10) / 10;
};

/**
 * -------------------------------------------------------------
 * FÓRMULAS DE 1RM SUBMÁXIMO (Epley, Brzycki, Lander, etc.)
 * -------------------------------------------------------------
 */
export const calculateSubmaximal1RM = (weight, reps) => {
  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  if (isNaN(w) || w <= 0 || isNaN(r) || r <= 0) return null;

  if (r === 1) {
    return {
      epley: w,
      brzycki: w,
      lander: w,
      lombardi: w,
      oConner: w,
      consensus: w
    };
  }

  // Fórmulas
  const epley = w * (1 + r / 30);
  const brzycki = r < 37 ? w * (36 / (37 - r)) : w;
  const lander = (100 * w) / (101.3 - 2.67123 * r);
  const lombardi = w * Math.pow(r, 0.10);
  const oConner = w * (1 + 0.025 * r);

  const values = [epley, brzycki, lander, lombardi, oConner].filter(v => v > 0 && !isNaN(v));
  const consensus = values.reduce((a, b) => a + b, 0) / values.length;

  return {
    epley: Math.round(epley * 10) / 10,
    brzycki: Math.round(brzycki * 10) / 10,
    lander: Math.round(lander * 10) / 10,
    lombardi: Math.round(lombardi * 10) / 10,
    oConner: Math.round(oConner * 10) / 10,
    consensus: Math.round(consensus * 10) / 10
  };
};

/**
 * -------------------------------------------------------------
 * DIAGNÓSTICO Y COMENTARIOS CIENTÍFICOS AUTOMATIZADOS (AI COACH)
 * -------------------------------------------------------------
 */
export const generateScientificDiagnostic = ({ regression, real1RM, athlete, exerciseName = 'Ejercicio' }) => {
  if (!regression || !regression.valid) {
    return {
      hasData: false,
      headline: 'Datos Insuficientes para Diagnóstico',
      status: 'pending',
      color: '#94a3b8',
      summary: 'Se requieren al menos 2 series con cargas progresivas y su velocidad media para generar el análisis biomecánico.',
      recommendations: [
        'Realiza una serie con carga ligera (~40-50% 1RM) a máxima aceleración.',
        'Realiza una serie con carga media-alta (~70-80% 1RM) respetando 3 minutos de descanso.'
      ]
    };
  }

  const { slope, r2, estimated1RM } = regression;
  const absSlope = Math.abs(slope);

  let profileType = 'equilibrado';
  let profileComment = '';
  let recommendations = [];

  // 1. Análisis de Pendiente (Fuerza vs Velocidad)
  if (absSlope >= 0.014) {
    profileType = 'deficit_fuerza';
    profileComment = `Perfil con caída acusada de velocidad (pendiente: ${slope} m/s/kg). El atleta desacelera notablemente al incrementar el peso, lo que evidencia un déficit de fuerza máxima neural.`;
    recommendations.push('Priorizar adaptaciones neurales con cargas > 80% 1RM (1-4 reps) a máxima intención concéntrica.');
    recommendations.push('Incorporar trabajo isométrico en el punto de estancamiento (sticking point).');
  } else if (absSlope <= 0.0075) {
    profileType = 'deficit_velocidad';
    profileComment = `Perfil plano y resistente (pendiente: ${slope} m/s/kg). El atleta posee sólida base estructural de fuerza, pero le cuesta aplicar fuerza explosiva a altas velocidades con cargas ligeras.`;
    recommendations.push('Entrenar en la zona de Potencia Máxima y Velocidad (45-65% 1RM) con feedback inmediato en pantalla.');
    recommendations.push('Limitar la fatiga de la serie: suspender el set al registrar una pérdida de velocidad > 10%.');
  } else {
    profileType = 'equilibrado';
    profileComment = `Perfil Óptimo y Equilibrado (pendiente: ${slope} m/s/kg). Existe una transferencia armónica entre la fuerza base y la velocidad de desplazamiento de la barra.`;
    recommendations.push('Mantener distribución ondulante de cargas (días de potencia al 60% y días de fuerza al 85%).');
  }

  // 2. Análisis de Consistencia R²
  let r2Comment = '';
  if (r2 >= 0.95) {
    r2Comment = `Ajuste lineal de precisión excelente (R² = ${Math.round(r2 * 100)}%). El atleta ejecutó cada repetición con máxima intención volitiva, lo que garantiza que el 1RM estimado tiene un error inferior al 2%.`;
  } else if (r2 >= 0.85) {
    r2Comment = `Ajuste lineal bueno (R² = ${Math.round(r2 * 100)}%). Perfil representativo para la autoregulación de la carga del día.`;
  } else {
    r2Comment = `Dispersión moderada en la curva (R² = ${Math.round(r2 * 100)}%). Se recomienda asegurar pausas de descanso completas (3-5 min) y evitar desaceleraciones prematuras antes del bloqueo.`;
  }

  // 3. Comparativa 1RM Estimado vs Real
  let readinessComment = '';
  let readinessStatus = 'normal';
  if (real1RM && estimated1RM) {
    const diff = estimated1RM - real1RM;
    if (diff >= 3.0) {
      readinessStatus = 'fresh';
      readinessComment = `🚀 Estado Óptimo / Día Pico: El 1RM diario estimado (${estimated1RM} kg) supera el récord histórico (${real1RM} kg) en +${diff.toFixed(1)} kg. El sistema neuromuscular está en condiciones óptimas para registrar una nueva marca personal.`;
      recommendations.unshift(`¡Día propicio para buscar récord personal! El sistema nervioso está fresco.`);
    } else if (diff <= -5.0) {
      readinessStatus = 'fatigued';
      readinessComment = `⚠️ Fatiga Neuromuscular Acumulada: El 1RM diario (${estimated1RM} kg) está ${Math.abs(diff).toFixed(1)} kg por debajo del récord histórico (${real1RM} kg). La velocidad de ejecución está deprimida.`;
      recommendations.unshift('Se sugiere reducir el volumen de la sesión o entrenar por velocidad conservadora (RIR 2-3).');
    } else {
      readinessStatus = 'stable';
      readinessComment = `Marcas estables y en rango esperado: 1RM estimado (${estimated1RM} kg) alineado con su récord actual (${real1RM} kg).`;
    }
  }

  return {
    hasData: true,
    headline: readinessStatus === 'fresh' 
      ? 'Día Pico Neuromuscular (Potencial de PR)' 
      : readinessStatus === 'fatigued'
        ? 'Alerta de Fatiga Neuromuscular'
        : 'Perfil VBT Validado',
    status: readinessStatus,
    color: readinessStatus === 'fresh' ? '#10b981' : readinessStatus === 'fatigued' ? '#f59e0b' : '#38bdf8',
    profileType,
    profileComment,
    r2Comment,
    readinessComment,
    recommendations
  };
};
