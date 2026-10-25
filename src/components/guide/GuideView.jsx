import React from 'react';
import { HelpCircle, BookOpen, CheckCircle } from 'lucide-react';

export const GuideView = () => {
  const sections = [
    {
      title: '1. Dashboard (Centro de Mando)',
      content: 'Muestra los KPIs globales de tu equipo, accesos directos de un clic a las acciones más comunes (Nueva Sesión, Registrar 1RM, Registrar Potencia) y una cronología con la actividad reciente.'
    },
    {
      title: '2. Gestión de Atletas',
      content: 'Crea fichas completas para cada levantador o atleta. Al pulsar "Observar" accederás a su ficha con fuerza relativa calculada automáticamente (1RM / Peso Corporal) y el listado de todos sus récords personales (PRs).'
    },
    {
      title: '3. Biblioteca de Ejercicios',
      content: 'Clasificada en tres pilares fundamentales: Ley de Hill (Fuerza básica), DLP (Derivados del Levantamiento Olímpico) y Balístico Explosivo (Saltos, sprints y lanzamientos).'
    },
    {
      title: '4. Registro de 1RM y Potencia',
      content: 'Registra tus marcas máximas. Incluye la calculadora de Brzycki para estimar tu 1RM a partir de cualquier serie submáxima (ej. 5 reps con 100 kg = 115.4 kg 1RM estimado). En potencia puedes registrar altura de salto (cm) o velocidad media propulsiva (m/s).'
    },
    {
      title: '5. Módulo de Sesiones (Complejos y Superseries)',
      content: 'Permite registrar entrenamientos avanzados combinando ejercicios en bloques (por ejemplo: Bloque A = Snatch Pull + Hang Snatch). Selecciona la asistencia del equipo y guarda notas de RPE y descanso.'
    },
    {
      title: '6. Análisis y Curvas VBT',
      content: 'Inspecciona la progresión histórica de cualquier atleta en cualquier ejercicio, o consulta los puntos de su perfil carga-velocidad para prescribir zonas de entrenamiento neuromuscular.'
    },
    {
      title: '7. Utilidades de Gimnasio',
      content: 'Incluye la Tabla de Porcentajes de trabajo (50% a 100%), la Calculadora de Discos por lado de la barra para no equivocarte al cargar, y un Cronómetro de descanso con presets de 60s a 180s.'
    },
    {
      title: '8. Logros y Leaderboard',
      content: 'Gamificación de entrenamiento. Desbloquea insignias de Club 1.5x BW, Club 2.0x BW, Club 100kg Banca, Salto 50cm+, y consulta el ranking dinámico del equipo para fomentar una sana competitividad.'
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6 animate-in fade-in duration-150">
      <div className="flex items-center gap-2.5 text-red-500 pb-4 border-b border-slate-800">
        <BookOpen className="w-6 h-6" />
        <h3 className="text-xl font-bold text-white">Guía Oficial de Usuario - Máxima Potencia</h3>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed">
        Bienvenido a la versión moderna y modular de <strong>Máxima Potencia</strong>. A continuación encontrarás una explicación detallada de cada módulo para sacar el máximo rendimiento a tus entrenamientos:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((sec, idx) => (
          <div key={idx} className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-red-400" />
              <span>{sec.title}</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {sec.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
