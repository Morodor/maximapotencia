// src/components/reports/RadarChart.jsx
import React from 'react';

/**
 * Gráfico de Radar SVG de 5 ejes para Perfil Neuromuscular y Fuerza
 * Ejes:
 * 1. Sentadilla (Fuerza Tren Inferior)
 * 2. Press Banca (Fuerza Empuje Superior)
 * 3. Peso Muerto (Tracción / Cadena Posterior)
 * 4. Salto CMJ (Potencia Elástico-Explosiva)
 * 5. Velocidad VBT (Velocidad Neuromuscular)
 */
export const RadarChart = ({ 
  data = {}, 
  theme = 'dark', // 'dark' | 'light'
  size = 320 
}) => {
  // Configuración de los 5 ejes
  const axes = [
    { key: 'squat', label: 'Sentadilla (Inf.)', raw: data.squatRaw || '0 kg', score: data.squatScore || 20 },
    { key: 'bench', label: 'Banca (Empuje)', raw: data.benchRaw || '0 kg', score: data.benchScore || 20 },
    { key: 'deadlift', label: 'P. Muerto (Cadena Post.)', raw: data.deadliftRaw || '0 kg', score: data.deadliftScore || 20 },
    { key: 'jump', label: 'Salto CMJ (Potencia)', raw: data.jumpRaw || '0 cm', score: data.jumpScore || 20 },
    { key: 'vbt', label: 'Velocidad VBT', raw: data.vbtRaw || '0 m/s', score: data.vbtScore || 20 }
  ];

  const totalAxes = axes.length;
  const center = size / 2;
  const radius = (size / 2) - 48; // Margen para las etiquetas
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0]; // Círculos concéntricos (20%, 40%, 60%, 80%, 100%)

  // Helper para convertir ángulo y radio a coordenadas cartesianas (x, y)
  const getCoordinates = (index, valueRatio) => {
    // Comenzar arriba (-90 grados o -PI/2)
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const r = radius * valueRatio;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Coordenadas de los puntos del atleta
  const points = axes.map((axis, i) => {
    const ratio = Math.max(0.1, Math.min(1.0, axis.score / 100));
    return getCoordinates(i, ratio);
  });

  const polygonPath = points.map(p => `${p.x},${p.y}`).join(' ');

  // Estilos según tema
  const isDark = theme === 'dark';
  const gridColor = isDark ? '#334155' : '#cbd5e1';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const polyFill = isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(220, 38, 38, 0.25)';
  const polyStroke = isDark ? '#ef4444' : '#dc2626';
  const pointFill = isDark ? '#f87171' : '#b91c1c';

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={isDark ? "0.45" : "0.3"} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
          </radialGradient>
        </defs>

        {/* Círculos / Polígonos de Nivel de Fondo */}
        {levels.map((level, lvlIdx) => {
          const levelPoints = axes.map((_, i) => {
            const coord = getCoordinates(i, level);
            return `${coord.x},${coord.y}`;
          }).join(' ');

          return (
            <polygon
              key={lvlIdx}
              points={levelPoints}
              fill="none"
              stroke={gridColor}
              strokeWidth={lvlIdx === levels.length - 1 ? "1.5" : "1"}
              strokeDasharray={lvlIdx < levels.length - 1 ? "3 3" : "none"}
              opacity={isDark ? 0.6 : 0.8}
            />
          );
        })}

        {/* Ejes Radiales desde el centro */}
        {axes.map((_, i) => {
          const outerCoord = getCoordinates(i, 1.0);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={outerCoord.x}
              y2={outerCoord.y}
              stroke={gridColor}
              strokeWidth="1"
              opacity={0.5}
            />
          );
        })}

        {/* Polígono de Rendimiento del Atleta */}
        <polygon
          points={polygonPath}
          fill="url(#radarGlow)"
          stroke={polyStroke}
          strokeWidth="2.5"
          className="transition-all duration-300"
        />

        {/* Puntos en los Vértices */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4.5"
            fill={pointFill}
            stroke={isDark ? "#0f172a" : "#ffffff"}
            strokeWidth="2"
          />
        ))}

        {/* Etiquetas de cada Eje */}
        {axes.map((axis, i) => {
          // Posición un poco más allá del radio exterior
          const labelCoord = getCoordinates(i, 1.22);
          const isTop = i === 0;
          const isBottom = i === 2 || i === 3;
          const isLeft = labelCoord.x < center - 10;
          const isRight = labelCoord.x > center + 10;

          let textAnchor = 'middle';
          if (isLeft) textAnchor = 'end';
          if (isRight) textAnchor = 'start';

          return (
            <g key={i} className="transition-all">
              <text
                x={labelCoord.x}
                y={labelCoord.y - 4}
                textAnchor={textAnchor}
                fill={textColor}
                fontSize="11"
                fontWeight="700"
                className="font-sans"
              >
                {axis.label}
              </text>
              <text
                x={labelCoord.x}
                y={labelCoord.y + 10}
                textAnchor={textAnchor}
                fill={subtextColor}
                fontSize="10"
                fontWeight="600"
                className="font-mono"
              >
                {axis.raw} ({axis.score} pts)
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
