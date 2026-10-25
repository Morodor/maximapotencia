import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getSystemInstruction = (action: string) => {
  const baseInstruction = `Eres el motor algorítmico de periodización deportiva de "Máxima Potencia". Tu rol es actuar como un Entrenador Experto en Halterofilia y Preparación Física Deportiva de élite.
Posees conocimiento absoluto de los sistemas Búlgaro, Ruso y Chino. BASA TUS DECISIONES EN LOS DOCUMENTOS ADJUNTOS (PDFs) siempre que sea posible.`;

  const formatoZonas = `
Estructura la sesión del día así:
1. ZONA DE POTENCIA PURA (Balísticos): < 250 ms. Máxima RFD. Al inicio.
2. ZONA DE VELOCIDAD (DLP): Derivados del Levantamiento Olímpico. Máxima potencia. Indicar %.
3. ZONA DE FUERZA MÁXIMA Y ESTRUCTURAL: Cadena cerrada y básicos. Alta intensidad o volumen según la fase.
4. ZONA DE ASISTENCIA / CORRECTIVA (NUEVO): Basado en la "Deficiencia Técnica" (Movimiento a corregir y Fase deficiente) del atleta, asigna ejercicios ultra-específicos (ej. Drop Snatches si el movimiento es Snatch y la fase es Recepción lenta).

SISTEMA DE AUTORREGULACIÓN (RPE Y SUEÑO):
- Si RPE > 8/10 o Calidad de Sueño < 5/10: Reduce volumen de Fuerza 15-20%.
- Si RM de Front Squat es bajo respecto al Back Squat (< 80%), prioriza Front Squat.`;

  if (action === "CREATE_MACROCYCLE") {
    return `${baseInstruction}

OBJETIVO:
Diseña el PLAN DE PERIODIZACIÓN (Macrociclo) completo y la SESIÓN DIARIA para el Día 1.

DIRECTRICES DEL MACROCICLO:
- Divide el tiempo (3-6 meses) en Mesociclos lógicos.
- Asigna duración en semanas y objetivo fisiológico de cada fase.
- CONGRUENCIA DE FRECUENCIA: Si los "días por semana" son incongruentes con el Objetivo (ej. 5 días para Fuerza Máxima), CORRIGE los 'sesiones_por_semana' a un número óptimo.
${formatoZonas}

RESTRICCIÓN DE FORMATO:
Devuelve ÚNICAMENTE un objeto JSON válido:
{
  "plan_periodizacion": {
     "duracion_total": "X meses",
     "distribucion_mesociclos": [ {"nombre": "", "duracion_semanas": 0, "objetivo": "", "sesiones_por_semana": 0} ]
  },
  "fase_actual": "Mesociclo 1 - Semana 1 - Día 1",
  "sesion_diaria": {
    "zona_balistica": [{"ejercicio": "", "series": 0, "repeticiones": 0, "descanso_segundos": 0, "intensidad": ""}],
    "zona_dlp": [{"ejercicio": "", "porcentaje_rm": 0, "series": 0, "repeticiones": 0, "descanso_segundos": 0}],
    "zona_fuerza": [{"ejercicio": "", "porcentaje_rm": 0, "series": 0, "repeticiones": 0, "descanso_segundos": 0}],
    "zona_correctiva": [{"ejercicio": "", "series": 0, "repeticiones": 0, "descanso_segundos": 0, "proposito": ""}]
  },
  "ajuste_autoregulacion": "Explicación."
}`;
  } else {
    // GENERATE_DAILY
    return `${baseInstruction}

OBJETIVO:
El atleta YA TIENE un Macrociclo creado. Tu tarea es generar la SESIÓN DIARIA exacta para el día de entrenamiento actual basándote estrictamente en los parámetros del Mesociclo en el que se encuentra.
${formatoZonas}

RESTRICCIÓN DE FORMATO:
Devuelve ÚNICAMENTE un objeto JSON válido con la sesión (no devuelvas el plan_periodizacion entero, ya lo tenemos):
{
  "fase_actual": "Nombre de la Fase actual - Semana X - Día Y",
  "sesion_diaria": {
    "zona_balistica": [{"ejercicio": "", "series": 0, "repeticiones": 0, "descanso_segundos": 0, "intensidad": ""}],
    "zona_dlp": [{"ejercicio": "", "porcentaje_rm": 0, "series": 0, "repeticiones": 0, "descanso_segundos": 0}],
    "zona_fuerza": [{"ejercicio": "", "porcentaje_rm": 0, "series": 0, "repeticiones": 0, "descanso_segundos": 0}],
    "zona_correctiva": [{"ejercicio": "", "series": 0, "repeticiones": 0, "descanso_segundos": 0, "proposito": ""}]
  },
  "ajuste_autoregulacion": "Explicación."
}`;
  }
};

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { action, athleteData, activePlan, semana_actual, dia_actual } = payload;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "API Key de Gemini no configurada." }, { status: 500 });
    }

    let prompt = "";
    if (action === "CREATE_MACROCYCLE") {
      prompt = `Genera el Plan de Periodización y la Sesión de Entrenamiento (Día 1) para el siguiente atleta:\n${JSON.stringify(athleteData, null, 2)}`;
    } else {
      prompt = `Genera la Sesión de Entrenamiento de HOY para este atleta:
Datos Biométricos y de Recuperación: ${JSON.stringify(athleteData, null, 2)}
Macrociclo Activo: ${JSON.stringify(activePlan, null, 2)}
UBICACIÓN TEMPORAL: El atleta se encuentra actualmente en la Semana ${semana_actual}, Día de Entrenamiento ${dia_actual} de la semana.`;
    }

    const contents: any[] = [prompt];

    const urisPath = path.join(process.cwd(), "docs", "uris.json");
    if (fs.existsSync(urisPath)) {
      const uris = JSON.parse(fs.readFileSync(urisPath, "utf-8"));
      for (const [filename, uri] of Object.entries(uris)) {
        contents.push({
          fileData: { fileUri: uri, mimeType: "application/pdf" }
        });
        console.log(`Adjuntando referencia de archivo subido: ${filename}`);
      }
    } else {
      console.log("No se encontró docs/uris.json, no se adjuntarán PDFs en esta llamada.");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: contents,
      config: {
        systemInstruction: getSystemInstruction(action),
        responseMimeType: "application/json",
      },
    });

    const workoutData = JSON.parse(response.text() || "{}");
    return NextResponse.json(workoutData);
  } catch (error: any) {
    console.error("Error al generar la sesión:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar el entrenamiento." },
      { status: 500 }
    );
  }
}
