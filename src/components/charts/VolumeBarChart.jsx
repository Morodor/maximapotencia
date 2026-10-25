import React, { useEffect, useRef, useMemo } from 'react';
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

export const VolumeBarChart = ({ sessions = [], rmRecords = [] }) => {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Calcular las últimas 6 semanas
  const weeklyData = useMemo(() => {
    const weeks = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - d.getDay() + 1); // Lunes
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const label = `Sem ${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1}`;

      // Sumar volumen de sesiones en esa semana
      let volumeKg = 0;
      let sessionCount = 0;

      sessions.forEach(s => {
        const sDate = s.date?.toDate ? s.date.toDate() : new Date(s.date || 0);
        if (sDate >= startOfWeek && sDate <= endOfWeek) {
          sessionCount++;
          // Calcular tonelaje si la sesión tiene series
          if (Array.isArray(s.exercises)) {
            s.exercises.forEach(ex => {
              if (Array.isArray(ex.sets)) {
                ex.sets.forEach(set => {
                  const w = parseFloat(set.weight || 0);
                  const r = parseInt(set.reps || 0, 10);
                  if (w > 0 && r > 0) volumeKg += w * r;
                });
              }
            });
          }
        }
      });

      // Sumar tonelaje de RMs registrados esa semana como backup
      rmRecords.forEach(r => {
        const rDate = r.date?.toDate ? r.date.toDate() : new Date(r.date || 0);
        if (rDate >= startOfWeek && rDate <= endOfWeek) {
          volumeKg += parseFloat(r.weight || 0);
        }
      });

      weeks.push({
        label,
        volumeTons: Math.round((volumeKg / 1000) * 10) / 10, // En toneladas
        sessionCount
      });
    }

    return weeks;
  }, [sessions, rmRecords]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = weeklyData.map(w => w.label);
    const data = weeklyData.map(w => w.volumeTons);

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Volumen Total (Toneladas)',
            data,
            backgroundColor: 'rgba(239, 68, 68, 0.8)', // red-500
            borderColor: '#ef4444',
            borderWidth: 1.5,
            borderRadius: 6,
            hoverBackgroundColor: 'rgba(239, 68, 68, 1)'
          }
        ]
      },
      options: {
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
              label: (context) => {
                const item = weeklyData[context.dataIndex];
                return [
                  `🏋️ Tonelaje: ${context.raw} ton (${context.raw * 1000} kg)`,
                  `📅 Sesiones: ${item?.sessionCount || 0}`
                ];
              }
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
              callback: (val) => `${val} t`
            },
            suggestedMax: Math.max(1, ...data) * 1.2
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
  }, [weeklyData]);

  return (
    <div className="relative w-full h-64 bg-slate-950/80 rounded-xl border border-slate-800/80 p-3">
      <canvas ref={canvasRef} />
    </div>
  );
};
