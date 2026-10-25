import React, { useEffect, useRef } from 'react';
import {
  Chart,
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export const TeamLeaderboardChart = ({ athletes = [], rmRecords = [], exerciseName = 'Ejercicio' }) => {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Calcular mejor PR de cada atleta en el ejercicio y ordenar descendente
  const leaderboardData = athletes
    .map(a => {
      const records = rmRecords.filter(r => r.userId === a.id && r.exercise === exerciseName);
      const best = records.reduce((max, r) => Math.max(max, r.weight || 0), 0);
      return {
        id: a.id,
        name: a.name,
        bestWeight: best
      };
    })
    .filter(a => a.bestWeight > 0)
    .sort((a, b) => b.bestWeight - a.bestWeight);

  useEffect(() => {
    if (!canvasRef.current || leaderboardData.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = leaderboardData.map((d, i) => {
      const medal = i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : `#${i + 1} `;
      return `${medal}${d.name}`;
    });

    const data = leaderboardData.map(d => d.bestWeight);

    // Colores para el podio
    const backgroundColors = leaderboardData.map((_, i) => {
      if (i === 0) return 'rgba(234, 179, 8, 0.85)'; // oro
      if (i === 1) return 'rgba(148, 163, 184, 0.85)'; // plata
      if (i === 2) return 'rgba(217, 119, 6, 0.85)'; // bronce
      return 'rgba(239, 68, 68, 0.7)'; // rojo
    });

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: `${exerciseName} (kg)`,
            data,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map(c => c.replace('0.85', '1').replace('0.7', '1')),
            borderWidth: 1.5,
            borderRadius: 6
          }
        ]
      },
      options: {
        indexAxis: 'y', // Barra horizontal para fácil lectura de nombres
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#ffffff',
            bodyColor: '#e2e8f0',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => `Récord Personal: ${context.raw} kg`
            }
          }
        },
        scales: {
          x: {
            grid: { color: '#1e293b' },
            ticks: {
              color: '#64748b',
              font: { family: 'Inter', size: 11 },
              callback: (val) => `${val} kg`
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              color: '#e2e8f0',
              font: { family: 'Inter', size: 12, weight: '600' }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [leaderboardData, exerciseName]);

  if (leaderboardData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-slate-950/60 rounded-xl border border-dashed border-slate-800 p-6 text-center">
        <p className="text-sm font-semibold text-slate-400">Sin marcas registradas</p>
        <p className="text-xs text-slate-500 mt-1">Ningún atleta tiene registrado un 1RM en este ejercicio todavía.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: `${Math.max(260, leaderboardData.length * 48)}px` }}>
      <div className="w-full h-full bg-slate-950/80 rounded-xl border border-slate-800/80 p-3">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};
