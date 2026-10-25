import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Save, User, Layers } from 'lucide-react';

export const AthleteModal = ({ isOpen, onClose, athleteToEdit = null }) => {
  const { groups, addAthlete, updateAthlete } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    dob: '',
    weight: '',
    height: '',
    phone: '',
    description: '',
    photoUrl: ''
  });

  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  useEffect(() => {
    if (athleteToEdit) {
      setFormData({
        name: athleteToEdit.name || '',
        nickname: athleteToEdit.nickname || '',
        dob: athleteToEdit.dob || '',
        weight: athleteToEdit.weight || '',
        height: athleteToEdit.height || '',
        phone: athleteToEdit.phone || '',
        description: athleteToEdit.description || '',
        photoUrl: athleteToEdit.photoUrl || ''
      });
      // Sincronizar grupos del atleta
      const current = athleteToEdit.groupIds || 
        groups.filter(g => g.athleteIds && g.athleteIds.includes(athleteToEdit.id)).map(g => g.id);
      setSelectedGroupIds(current || []);
    } else {
      setFormData({
        name: '',
        nickname: '',
        dob: '',
        weight: '',
        height: '',
        phone: '',
        description: '',
        photoUrl: ''
      });
      setSelectedGroupIds([]);
    }
  }, [athleteToEdit, isOpen, groups]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      nickname: formData.nickname,
      dob: formData.dob,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      height: formData.height ? parseFloat(formData.height) : null,
      phone: formData.phone,
      description: formData.description,
      photoUrl: formData.photoUrl,
      groupIds: selectedGroupIds
    };

    let ok = false;
    if (athleteToEdit?.id) {
      ok = await updateAthlete(athleteToEdit.id, payload);
    } else {
      ok = await addAthlete(payload);
    }

    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 w-full max-w-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-2xl font-bold text-white mb-6">
          {athleteToEdit ? 'Editar Atleta' : 'Añadir Nuevo Atleta'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej. Bayron Quezada"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Apodo / Alias
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="Ej. Toro"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Peso Corporal (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={e => setFormData({ ...formData, weight: e.target.value })}
                placeholder="80.5"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Estatura (cm)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.height}
                onChange={e => setFormData({ ...formData, height: e.target.value })}
                placeholder="178"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={e => setFormData({ ...formData, dob: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Teléfono / WhatsApp (para Fichas)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+56 9 1234 5678"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                URL de Foto (opcional)
              </label>
              <input
                type="url"
                value={formData.photoUrl}
                onChange={e => setFormData({ ...formData, photoUrl: e.target.value })}
                placeholder="https://..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Notas y Objetivos del Atleta
            </label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Objetivos de la temporada, lesiones previas o notas específicas..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>

          {/* Selector de Grupos de Trabajo Asignados */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase">
                Grupos de Trabajo / Cuadrillas
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {selectedGroupIds.length} {selectedGroupIds.length === 1 ? 'grupo asignado' : 'grupos asignados'}
              </span>
            </div>

            {groups.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                Aún no has creado grupos de trabajo. Podrás crearlos desde la vista principal de Atletas.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                {groups.map(grp => {
                  const isAssigned = selectedGroupIds.includes(grp.id);
                  return (
                    <button
                      type="button"
                      key={grp.id}
                      onClick={() => {
                        if (isAssigned) {
                          setSelectedGroupIds(selectedGroupIds.filter(id => id !== grp.id));
                        } else {
                          setSelectedGroupIds([...selectedGroupIds, grp.id]);
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isAssigned
                          ? 'shadow-sm text-white'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                      style={{
                        backgroundColor: isAssigned ? grp.color : undefined,
                        borderColor: isAssigned ? grp.color : undefined,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: isAssigned ? '#ffffff' : grp.color }}
                      />
                      <span>{grp.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-red-900/30 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Atleta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
