import React, { useEffect, useRef } from 'react';
import {
  Chart,
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export const ProgressLineChart = ({ records = [], exerciseName = 'Ejercicio' }) => {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || records.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Ordenar cronológicamente ascendente
    const sorted = [...records].sort((a, b) => {
      const da = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
      const db = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
      return da - db;
    });

    const labels = sorted.map((r, i) => {
      if (r.date?.toDate) {
        return r.date.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      }
      if (typeof r.date === 'string' && r.date.length >= 10) {
        return r.date.substring(5); // MM-DD
      }
      return `Test #${i + 1}`;
    });

    const data = sorted.map(r => r.weight || 0);

    // Gradiente para el área bajo la curva
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.35)'); // red-500 con transparencia
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `${exerciseName} (kg)`,
            data,
            borderColor: '#ef4444',
            backgroundColor: gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.35, // Curvatura suave
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
          legend: {
            display: false
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
              label: (context) => `Marca: ${context.raw} kg`
            }
          }
        },
        scales: {
          x: {
            grid: { color: '#1e293b' },
            ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }
          },
          y: {
            grid: { color: '#1e293b' },
            ticks: {
              color: '#64748b',
              font: { family: 'Inter', size: 11 },
              callback: (val) => `${val} kg`
            },
            suggestedMin: Math.max(0, Math.min(...data) - 10),
            suggestedMax: Math.max(...data) + 10
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
  }, [records, exerciseName]);

  if (records.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-slate-950/60 rounded-xl border border-dashed border-slate-800 p-6 text-center">
        <p className="text-sm font-semibold text-slate-400">Sin historial suficiente</p>
        <p className="text-xs text-slate-500 mt-1">Registra al menos una marca de 1RM para este ejercicio.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-72 bg-slate-950/80 rounded-xl border border-slate-800/80 p-3">
      <canvas ref={canvasRef} />
    </div>
  );
};
