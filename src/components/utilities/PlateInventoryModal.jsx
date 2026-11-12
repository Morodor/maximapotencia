import React, { useState, useEffect } from 'react';
import { X, Save, Disc3, RotateCcw, Check, Sparkles } from 'lucide-react';

export const DEFAULT_PLATE_INVENTORIES = {
  unlimited: {
    id: 'unlimited',
    name: 'Gimnasio Comercial (Ilimitado)',
    description: 'Discos ilimitados de todos los pesos estándar.',
    isUnlimited: true,
    plates: {
      25: 20,
      20: 20,
      15: 20,
      10: 20,
      5: 20,
      2.5: 20,
      1.25: 20,
      0.5: 20
    }
  },
  olympic_140: {
    id: 'olympic_140',
    name: 'Set Olímpico 140 kg (Bumper estándar)',
    description: 'Set clásico con 1 par de cada medida grande y fraccionales.',
    isUnlimited: false,
    plates: {
      25: 0,
      20: 2,
      15: 2,
      10: 2,
      5: 2,
      2.5: 2,
      1.25: 2,
      0.5: 2
    }
  },
  home_gym: {
    id: 'home_gym',
    name: 'Home Gym Personal (100 kg)',
    description: 'Configuración típica casera sin discos de 25 kg.',
    isUnlimited: false,
    plates: {
      25: 0,
      20: 2,
      15: 0,
      10: 2,
      5: 4,
      2.5: 4,
      1.25: 2,
      0.5: 0
    }
  }
};

const PLATE_DENOMINATIONS = [
  { weight: 25, label: '25 kg (Rojo)', color: 'bg-red-600 text-white' },
  { weight: 20, label: '20 kg (Azul)', color: 'bg-blue-600 text-white' },
  { weight: 15, label: '15 kg (Amarillo)', color: 'bg-amber-500 text-slate-900' },
  { weight: 10, label: '10 kg (Verde)', color: 'bg-emerald-600 text-white' },
  { weight: 5, label: '5 kg (Blanco / Negro)', color: 'bg-slate-300 text-slate-900' },
  { weight: 2.5, label: '2.5 kg (Micro Rojo)', color: 'bg-red-500 text-white' },
  { weight: 1.25, label: '1.25 kg (Micro Azul)', color: 'bg-blue-500 text-white' },
  { weight: 0.5, label: '0.5 kg (Micro Gris)', color: 'bg-slate-400 text-slate-900' }
];

export const PlateInventoryModal = ({ isOpen, onClose, currentInventory, onSaveInventory }) => {
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [inventoryName, setInventoryName] = useState('Mis Discos');
  const [plates, setPlates] = useState({
    25: 2,
    20: 4,
    15: 2,
    10: 4,
    5: 4,
    2.5: 4,
    1.25: 2,
    0.5: 2
  });

  useEffect(() => {
    if (currentInventory) {
      setInventoryName(currentInventory.name || 'Mis Discos');
      setSelectedPreset(currentInventory.id || 'custom');
      setPlates({ ...(currentInventory.plates || {}) });
    }
  }, [currentInventory, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetKey) => {
    const preset = DEFAULT_PLATE_INVENTORIES[presetKey];
    if (preset) {
      setSelectedPreset(preset.id);
      setInventoryName(preset.name);
      setPlates({ ...preset.plates });
    }
  };

  const handlePlateCountChange = (weight, count) => {
    setSelectedPreset('custom');
    setPlates(prev => ({
      ...prev,
      [weight]: Math.max(0, parseInt(count, 10) || 0)
    }));
  };

  const calculateTotalWeight = () => {
    return Object.entries(plates).reduce((acc, [w, count]) => {
      return acc + (parseFloat(w) * (count || 0));
    }, 0);
  };

  const handleSave = () => {
    const payload = {
      id: selectedPreset === 'custom' ? 'custom_' + Date.now() : selectedPreset,
      name: inventoryName.trim() || 'Mis Discos',
      plates: { ...plates },
      totalPlateWeight: calculateTotalWeight()
    };
    onSaveInventory(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 space-y-5">
        
        {/* Cabecera */}
        <div className="flex justify-between items-start pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Disc3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Inventario de Discos Disponibles</h3>
              <p className="text-xs text-slate-400">
                La app armará la barra usando únicamente los discos que tienes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Rápidos */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase">
            Cargar Plantilla Rápida:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {Object.entries(DEFAULT_PLATE_INVENTORIES).map(([key, item]) => (
              <button
                type="button"
                key={key}
                onClick={() => handleApplyPreset(key)}
                className={`p-2.5 rounded-xl border text-left transition-all text-xs font-semibold ${
                  selectedPreset === item.id
                    ? 'bg-amber-950/30 border-amber-500/60 text-white ring-1 ring-amber-500/40'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold truncate text-[11px]">{item.name.split('(')[0]}</span>
                  {selectedPreset === item.id && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </div>
                <span className="text-[10px] text-slate-500 block truncate">{item.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Nombre del Perfil */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
            Nombre de este Perfil / Gimnasio:
          </label>
          <input
            type="text"
            value={inventoryName}
            onChange={e => setInventoryName(e.target.value)}
            placeholder="Ej. Mi Home Gym, Club Halterofilia, Gimnasio Comercial..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
          />
        </div>

        {/* Grilla de Conteo de Discos */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-slate-300 uppercase">
              Cantidad Total de Discos Disponibles:
            </label>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              Total: {calculateTotalWeight()} kg en discos
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto custom-scrollbar p-1">
            {PLATE_DENOMINATIONS.map((d) => {
              const currentCount = plates[d.weight] || 0;
              return (
                <div 
                  key={d.weight} 
                  className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-xl flex flex-col justify-between"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${d.color.split(' ')[0]}`} />
                    <span className="text-xs font-bold text-white font-mono">{d.weight} kg</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handlePlateCountChange(d.weight, Math.max(0, currentCount - 2))}
                      className="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-xs flex items-center justify-center active:scale-95 transition-all"
                    >
                      -2
                    </button>
                    <input
                      type="number"
                      min={0}
                      step={2}
                      value={currentCount}
                      onChange={e => handlePlateCountChange(d.weight, e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg py-1 text-center font-mono font-bold text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => handlePlateCountChange(d.weight, currentCount + 2)}
                      className="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-xs flex items-center justify-center active:scale-95 transition-all"
                    >
                      +2
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 text-center mt-1">
                    {Math.floor(currentCount / 2)} por lado
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer y Guardar */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => handleApplyPreset('unlimited')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Ilimitado</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-950/50 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Perfil de Discos</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
