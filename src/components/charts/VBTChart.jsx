import React, { useEffect, useRef } from 'react';
import {
  Chart,
  ScatterController,
  LineController,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';

// Registrar componentes necesarios de Chart.js
Chart.register(
  ScatterController,
  LineController,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export const VBTChart = ({ regressionData, exerciseName = 'Ejercicio' }) => {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !regressionData || !regressionData.valid) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const { points, regressionLine, estimated1RM, mvtUsed, r2Percentage } = regressionData;

    // Puntos medidos reales
    const scatterData = points.map(p => ({ x: p.load, y: p.velocity }));

    // Línea de regresión
    const lineData = regressionLine || [];

    // Punto 1RM Estimado
    const rmPointData = estimated1RM ? [{ x: estimated1RM, y: mvtUsed }] : [];

    chartInstanceRef.current = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            type: 'scatter',
            label: 'Series Medidas',
            data: scatterData,
            backgroundColor: '#ef4444', // red-500
            borderColor: '#fca5a5',
            borderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 9,
            pointHoverBackgroundColor: '#ffffff',
            order: 1
          },
          {
            type: 'line',
            label: `Recta Regresión (R² = ${r2Percentage}%)`,
            data: lineData,
            borderColor: '#38bdf8', // sky-400
            borderWidth: 2.5,
            borderDash: [4, 4],
            fill: false,
            pointRadius: 0,
            tension: 0,
            order: 2
          },
          ...(estimated1RM ? [{
            type: 'scatter',
            label: `1RM Estimado (${estimated1RM} kg @ ${mvtUsed} m/s)`,
            data: rmPointData,
            backgroundColor: '#10b981', // emerald-500
            borderColor: '#ffffff',
            borderWidth: 2.5,
            pointRadius: 8,
            pointHoverRadius: 11,
            pointStyle: 'rectRot',
            order: 0
          }] : [])
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#cbd5e1', // slate-300
              font: { family: 'Inter', size: 11, weight: '600' },
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#ffffff',
            bodyColor: '#e2e8f0',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const p = context.raw;
                if (context.dataset.label?.includes('1RM Estimado')) {
                  return `🎯 1RM Estimado: ${p.x} kg (${p.y} m/s MVT)`;
                }
                if (context.dataset.type === 'scatter') {
                  return `⚡ Carga: ${p.x} kg | Velocidad: ${p.y} m/s`;
                }
                return `Regresión: ${p.x} kg ➔ ${p.y} m/s`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: 'Carga Levantada (kg)',
              color: '#94a3b8',
              font: { family: 'Inter', size: 12, weight: '600' }
            },
            grid: { color: '#1e293b' },
            ticks: { color: '#64748b', font: { family: 'Inter' } }
          },
          y: {
            type: 'linear',
            title: {
              display: true,
              text: 'Velocidad Media (m/s)',
              color: '#94a3b8',
              font: { family: 'Inter', size: 12, weight: '600' }
            },
            grid: { color: '#1e293b' },
            ticks: { color: '#64748b', font: { family: 'Inter' } },
            suggestedMin: 0.1,
            suggestedMax: 1.4
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
  }, [regressionData]);

  if (!regressionData || !regressionData.valid) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-slate-950/60 rounded-xl border border-dashed border-slate-800 p-6 text-center">
        <p className="text-sm font-semibold text-slate-400">Datos insuficientes para el Perfil VBT</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          {regressionData?.reason || 'Registra al menos 2 repeticiones con distinta carga (kg) y velocidad (m/s) para este atleta en este ejercicio.'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-80 bg-slate-950/80 rounded-xl border border-slate-800/80 p-3">
      <canvas ref={canvasRef} />
    </div>
  );
};
