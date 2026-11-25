import React, { useState, useEffect } from 'react';
import { X, Save, Disc3, RotateCcw, Plus, Trash2 } from 'lucide-react';

export const DEFAULT_CUSTOM_PLATES = {
  25: 4,
  20: 4,
  15: 2,
  10: 4,
  5: 4,
  2.5: 4,
  2: 2,
  1.5: 2,
  1.25: 0,
  1: 2,
  0.5: 2
};

export const UNLIMITED_PLATES = {
  25: 20,
  20: 20,
  15: 20,
  10: 20,
  5: 20,
  2.5: 20,
  2: 20,
  1.5: 20,
  1.25: 20,
  1: 20,
  0.5: 20
};

export const DEFAULT_PLATE_INVENTORIES = {
  custom_default: {
    id: 'custom_default',
    name: 'Mi Gimnasio Personalizado',
    isLocalOnly: true,
    plates: { ...DEFAULT_CUSTOM_PLATES }
  },
  unlimited: {
    id: 'unlimited',
    name: 'Mi Gimnasio (Ilimitado)',
    isLocalOnly: true,
    plates: { ...UNLIMITED_PLATES }
  }
};

// Código oficial de colores olímpicos IWF (Estándar + Fraccionales)
const PLATE_DENOMINATIONS = [
  { weight: 25,   label: '25 KG',   bgHex: '#dc2626', borderHex: '#991b1b', rimHex: '#7f1d1d', textHex: '#ffffff', btnBg: 'rgba(0,0,0,0.28)' },
  { weight: 20,   label: '20 KG',   bgHex: '#2563eb', borderHex: '#1e40af', rimHex: '#1e3a8a', textHex: '#ffffff', btnBg: 'rgba(0,0,0,0.28)' },
  { weight: 15,   label: '15 KG',   bgHex: '#eab308', borderHex: '#a16207', rimHex: '#854d0e', textHex: '#0f172a', btnBg: 'rgba(0,0,0,0.14)' },
  { weight: 10,   label: '10 KG',   bgHex: '#16a34a', borderHex: '#166534', rimHex: '#14532d', textHex: '#ffffff', btnBg: 'rgba(0,0,0,0.28)' },
  { weight: 5,    label: '5 KG',    bgHex: '#f8fafc', borderHex: '#cbd5e1', rimHex: '#94a3b8', textHex: '#0f172a', btnBg: 'rgba(15,23,42,0.14)' },
  { weight: 2.5,  label: '2.5 KG',  bgHex: '#dc2626', borderHex: '#991b1b', rimHex: '#7f1d1d', textHex: '#ffffff', btnBg: 'rgba(0,0,0,0.28)' },
  { weight: 2,    label: '2 KG',    bgHex: '#2563eb', borderHex: '#1e40af', rimHex: '#1e3a8a', textHex: '#ffffff', btnBg: 'rgba(0,0,0,0.28)' },
  { weight: 1.5,  label: '1.5 KG',  bgHex: '#eab308', borderHex: '#a16207', rimHex: '#854d0e', textHex: '#0f172a', btnBg: 'rgba(0,0,0,0.14)' },
  { weight: 1.25, label: '1.25 KG', bgHex: '#94a3b8', borderHex: '#475569', rimHex: '#334155', textHex: '#0f172a', btnBg: 'rgba(15,23,42,0.16)' },
  { weight: 1,    label: '1 KG',    bgHex: '#16a34a', borderHex: '#166534', rimHex: '#14532d', textHex: '#ffffff', btnBg: 'rgba(0,0,0,0.28)' },
  { weight: 0.5,  label: '0.5 KG',  bgHex: '#f8fafc', borderHex: '#cbd5e1', rimHex: '#94a3b8', textHex: '#0f172a', btnBg: 'rgba(15,23,42,0.14)' }
];

const LOCAL_PROFILES_KEY = 'mp_local_plate_profiles';

export const PlateInventoryModal = ({ isOpen, onClose, currentInventory, onSaveInventory }) => {
  const [localProfiles, setLocalProfiles] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_PROFILES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      currentInventory?.id
        ? { ...currentInventory, plates: { ...DEFAULT_CUSTOM_PLATES, ...(currentInventory.plates || {}) } }
        : { ...DEFAULT_PLATE_INVENTORIES.custom_default }
    ];
  });

  const [activeProfileId, setActiveProfileId] = useState(() => currentInventory?.id || localProfiles[0]?.id || 'custom_default');
  const [inventoryName, setInventoryName] = useState(currentInventory?.name || 'Mi Gimnasio Personalizado');
  const [plates, setPlates] = useState(() => ({ ...DEFAULT_CUSTOM_PLATES, ...(currentInventory?.plates || {}) }));
  const [isAddingGym, setIsAddingGym] = useState(false);
  const [newGymName, setNewGymName] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem(LOCAL_PROFILES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocalProfiles(parsed);
        }
      }
    } catch {}

    if (currentInventory) {
      setActiveProfileId(currentInventory.id || 'custom_default');
      setInventoryName(currentInventory.name || 'Mi Gimnasio Personalizado');
      setPlates({ ...DEFAULT_CUSTOM_PLATES, ...(currentInventory.plates || {}) });
    }
    setIsAddingGym(false);
    setNewGymName('');
  }, [currentInventory, isOpen]);

  if (!isOpen) return null;

  const persistLocalProfiles = (list) => {
    setLocalProfiles(list);
    try {
      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error guardando perfiles locales:', e);
    }
  };

  const handleSelectProfile = (profileId) => {
    const found = localProfiles.find(p => p.id === profileId);
    if (!found) return;
    setActiveProfileId(found.id);
    setInventoryName(found.name);
    setPlates({ ...DEFAULT_CUSTOM_PLATES, ...(found.plates || {}) });
  };

  const handleCreateLocalProfile = () => {
    const cleanName = newGymName.trim();
    if (!cleanName) return;
    const newProfile = {
      id: 'local_gym_' + Date.now(),
      name: cleanName,
      isLocalOnly: true,
      plates: { ...DEFAULT_CUSTOM_PLATES }
    };
    const updated = [...localProfiles, newProfile];
    persistLocalProfiles(updated);
    setActiveProfileId(newProfile.id);
    setInventoryName(newProfile.name);
    setPlates({ ...newProfile.plates });
    setNewGymName('');
    setIsAddingGym(false);
  };

  const handleDeleteProfile = () => {
    if (localProfiles.length <= 1) return;
    const remaining = localProfiles.filter(p => p.id !== activeProfileId);
    persistLocalProfiles(remaining);
    const next = remaining[0];
    setActiveProfileId(next.id);
    setInventoryName(next.name);
    setPlates({ ...DEFAULT_CUSTOM_PLATES, ...(next.plates || {}) });
  };

  const handlePlateCountChange = (weight, rawValue) => {
    const parsed = rawValue === '' ? 0 : parseInt(rawValue, 10);
    setPlates(prev => ({
      ...prev,
      [weight]: Math.max(0, isNaN(parsed) ? 0 : parsed)
    }));
  };

  const handleSetUnlimited = () => {
    setPlates({ ...UNLIMITED_PLATES });
  };

  const calculateTotalWeight = () => {
    return Object.entries(plates).reduce((acc, [w, count]) => {
      return acc + (parseFloat(w) * (count || 0));
    }, 0);
  };

  const handleSave = () => {
    const finalName = inventoryName.trim() || 'Mi Gimnasio Personalizado';
    const payload = {
      id: activeProfileId || 'custom_default',
      name: finalName,
      isLocalOnly: true,
      plates: { ...plates },
      totalPlateWeight: calculateTotalWeight()
    };

    const exists = localProfiles.some(p => p.id === payload.id);
    const updatedList = exists
      ? localProfiles.map(p => (p.id === payload.id ? payload : p))
      : [...localProfiles, payload];

    persistLocalProfiles(updatedList);
    onSaveInventory(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Cabecera Compacta */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Disc3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">Mis Discos Olímpicos</h3>
              <p className="text-[11px] text-slate-400">
                Guardado solo en tu teléfono • Total: <strong className="text-amber-400 font-mono">{calculateTotalWeight()} kg</strong>
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

        {/* Selector Compacto de Gimnasio Local Personalizado */}
        <div className="py-3 border-b border-slate-800/80 space-y-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {localProfiles.length > 1 && !isAddingGym && (
              <select
                value={activeProfileId}
                onChange={(e) => handleSelectProfile(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {localProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}

            {!isAddingGym ? (
              <input
                type="text"
                value={inventoryName}
                onChange={e => setInventoryName(e.target.value)}
                placeholder="Mi Gimnasio Personalizado"
                className="flex-1 min-w-[160px] bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            ) : (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newGymName}
                  onChange={e => setNewGymName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateLocalProfile()}
                  placeholder="Nombre del otro gimnasio (solo en tu teléfono)"
                  className="flex-1 bg-slate-800 border border-amber-500/50 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={handleCreateLocalProfile}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingGym(false)}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs shrink-0"
                >
                  Cancelar
                </button>
              </div>
            )}

            {!isAddingGym && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddingGym(true)}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-bold transition-colors shrink-0"
                  title="Agregar otro perfil local en tu teléfono"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Otro Gym</span>
                </button>
                {localProfiles.length > 1 && (
                  <button
                    type="button"
                    onClick={handleDeleteProfile}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/60 border border-slate-700 text-slate-400 hover:text-red-400 transition-colors shrink-0"
                    title="Eliminar este perfil local"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Grilla Visual de Discos Olímpicos de Frente */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {PLATE_DENOMINATIONS.map((d) => {
              const currentCount = plates[d.weight] || 0;
              return (
                <div key={d.weight} className="flex flex-col items-center gap-1.5">
                  {/* Disco Olímpico de Frente */}
                  <div
                    className="relative w-32 h-32 sm:w-34 sm:h-34 rounded-full flex flex-col items-center justify-between py-2.5 px-2 shadow-xl select-none transition-transform"
                    style={{
                      backgroundColor: d.bgHex,
                      border: `4px solid ${d.borderHex}`,
                      boxShadow: `inset 0 0 0 4px ${d.rimHex}33, 0 10px 20px -5px rgba(0,0,0,0.5)`,
                      color: d.textHex
                    }}
                  >
                    {/* Peso arriba dentro del disco */}
                    <span className="text-[11px] sm:text-xs font-black tracking-tight uppercase leading-none drop-shadow-xs">
                      {d.label}
                    </span>

                    {/* Fila central dentro del disco: [-] [Cantidad editable] [+] */}
                    <div className="w-full flex items-center justify-between gap-1 px-0.5">
                      <button
                        type="button"
                        onClick={() => handlePlateCountChange(d.weight, Math.max(0, currentCount - 1))}
                        className="w-7 h-7 rounded-full font-black text-base flex items-center justify-center active:scale-90 transition-transform shadow-sm cursor-pointer shrink-0"
                        style={{
                          backgroundColor: d.btnBg,
                          color: d.textHex
                        }}
                        title="Restar 1 disco"
                      >
                        −
                      </button>

                      {/* Eje central metálico con input directo */}
                      <div className="w-11 h-11 rounded-full bg-slate-900/90 border-2 border-slate-400/80 shadow-inner flex items-center justify-center shrink-0">
                        <input
                          type="number"
                          min={0}
                          value={currentCount}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handlePlateCountChange(d.weight, e.target.value)}
                          className="w-full bg-transparent text-center font-mono font-black text-white text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          style={{ color: '#ffffff' }}
                          aria-label={`Cantidad de discos de ${d.weight} kg`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePlateCountChange(d.weight, currentCount + 1)}
                        className="w-7 h-7 rounded-full font-black text-base flex items-center justify-center active:scale-90 transition-transform shadow-sm cursor-pointer shrink-0"
                        style={{
                          backgroundColor: d.btnBg,
                          color: d.textHex
                        }}
                        title="Sumar 1 disco"
                      >
                        +
                      </button>
                    </div>

                    {/* Marca MP abajo dentro del disco */}
                    <span className="text-[10px] font-black tracking-[0.22em] uppercase leading-none opacity-90">
                      MP
                    </span>
                  </div>

                  {/* Indicador sutil debajo del disco */}
                  <span className="text-[10px] font-medium text-slate-400 font-mono">
                    {Math.floor(currentCount / 2)} por lado
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer y Guardar */}
        <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={handleSetUnlimited}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Poner Ilimitado</span>
          </button>

          <div className="flex gap-2 ml-auto">
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
              <span>Guardar Discos</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
