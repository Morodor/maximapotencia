import React, { useMemo } from 'react';
import { AlertCircle, SlidersHorizontal } from 'lucide-react';

export const STANDARD_PLATES = [
  { weight: 25, color: 'bg-red-600 border-red-700 text-white', height: 'h-28', width: 'w-4', label: '25' },
  { weight: 20, color: 'bg-blue-600 border-blue-700 text-white', height: 'h-28', width: 'w-4', label: '20' },
  { weight: 15, color: 'bg-amber-500 border-amber-600 text-slate-900', height: 'h-24', width: 'w-3.5', label: '15' },
  { weight: 10, color: 'bg-emerald-600 border-emerald-700 text-white', height: 'h-20', width: 'w-3', label: '10' },
  { weight: 5, color: 'bg-slate-200 border-slate-300 text-slate-900', height: 'h-16', width: 'w-2.5', label: '5' },
  { weight: 2.5, color: 'bg-red-500 border-red-600 text-white', height: 'h-14', width: 'w-2', label: '2.5' },
  { weight: 1.25, color: 'bg-blue-500 border-blue-600 text-white', height: 'h-12', width: 'w-2', label: '1.25' },
  { weight: 0.5, color: 'bg-slate-400 border-slate-500 text-slate-900', height: 'h-10', width: 'w-1.5', label: '0.5' },
];

export const calculatePlates = (targetWeight, barWeight = 20, userInventory = null) => {
  let remainingPerSide = Math.max(0, (targetWeight - barWeight) / 2);
  const result = [];

  for (const plate of STANDARD_PLATES) {
    const maxPerSide = userInventory?.plates 
      ? Math.floor((userInventory.plates[plate.weight] || 0) / 2) 
      : 999;
    let used = 0;

    while (remainingPerSide >= plate.weight - 0.001 && used < maxPerSide) {
      result.push(plate);
      remainingPerSide = Math.round((remainingPerSide - plate.weight) * 1000) / 1000;
      used++;
    }
  }

  const actualPlatesWeight = result.reduce((acc, p) => acc + p.weight, 0) * 2;
  const actualTotal = barWeight + actualPlatesWeight;

  return {
    platesPerSide: result,
    weightPerSide: Math.max(0, (targetWeight - barWeight) / 2),
    actualTotal,
    remainder: Math.max(0, targetWeight - actualTotal),
    isShort: (targetWeight - actualTotal) > 0.001
  };
};

export const PlateVisualizer = ({ 
  targetWeight = 100, 
  barWeight = 20, 
  userInventory = null,
  onOpenInventory = null 
}) => {
  const { platesPerSide, weightPerSide, actualTotal, remainder, isShort } = useMemo(
    () => calculatePlates(targetWeight, barWeight, userInventory),
    [targetWeight, barWeight, userInventory]
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Carga de Barra</span>
            {userInventory && (
              <span className="text-[10px] bg-slate-800 border border-slate-700 text-amber-400 font-mono px-2 py-0.5 rounded-full">
                {userInventory.name}
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-white font-mono flex items-baseline gap-2 mt-0.5">
            <span>{isShort ? actualTotal : targetWeight} kg</span>
            <span className="text-xs text-slate-400 font-normal">
              (Barra {barWeight}kg + {((actualTotal - barWeight) / 2).toFixed(1)}kg por lado)
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 font-medium">Discos por lado:</span>
          <p className="text-sm font-semibold text-emerald-400">
            {platesPerSide.length === 0 ? 'Sin discos adicionales' : `${platesPerSide.length} disco(s)`}
          </p>
        </div>
      </div>

      {/* Visual Bar Sleeve Graphic */}
      <div className="relative py-8 px-4 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-center overflow-x-auto min-h-[140px]">
        {/* Shaft (center bar) */}
        <div className="w-16 h-4 bg-gradient-to-r from-slate-600 via-slate-400 to-slate-500 rounded-l shadow-inner" />

        {/* Collar Inner Stopper */}
        <div className="w-3 h-16 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-sm shadow-md z-10" />

        {/* Sleeve (loading pin) */}
        <div className="relative flex items-center h-7 bg-gradient-to-b from-slate-400 via-slate-300 to-slate-500 rounded-r min-w-[140px] pl-1 pr-4 shadow-inner">
          {/* Loaded plates */}
          <div className="flex items-center gap-1 z-20">
            {platesPerSide.map((p, idx) => (
              <div
                key={idx}
                className={`${p.color} ${p.height} ${p.width} rounded-sm border flex items-center justify-center shadow-lg transition-all transform hover:scale-110 cursor-pointer`}
                title={`${p.weight} kg`}
              >
                <span className="text-[9px] font-black tracking-tighter transform -rotate-90 select-none">
                  {p.label}
                </span>
              </div>
            ))}
            {/* Collar Lock */}
            {platesPerSide.length > 0 && (
              <div className="w-2.5 h-10 bg-amber-400 border border-amber-600 rounded-sm shadow z-20" title="Collarín (traba)" />
            )}
          </div>
        </div>
      </div>

      {/* Aviso si faltan discos en el inventario del usuario */}
      {isShort && (
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Faltan <strong>{remainder.toFixed(1)} kg</strong> para el objetivo ({targetWeight}kg) por falta de discos en tu perfil. Carga armada: <strong>{actualTotal}kg</strong>.
            </span>
          </div>
          {onOpenInventory && (
            <button 
              onClick={onOpenInventory} 
              className="underline text-amber-400 hover:text-white font-bold shrink-0 text-xs"
            >
              Editar Mis Discos
            </button>
          )}
        </div>
      )}

      {/* Plate counts breakdown summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
        <div className="flex flex-wrap gap-2">
          {STANDARD_PLATES.map(p => {
            const count = platesPerSide.filter(x => x.weight === p.weight).length;
            if (count === 0) return null;
            return (
              <span
                key={p.weight}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                <span>{count}x {p.weight}kg</span>
                <span className="text-slate-400 font-mono text-[11px]">({count * 2} tot)</span>
              </span>
            );
          })}
        </div>

        {onOpenInventory && (
          <button
            onClick={onOpenInventory}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Mis Discos</span>
          </button>
        )}
      </div>
    </div>
  );
};
