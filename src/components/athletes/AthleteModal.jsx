import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Save, User, Layers, Camera, Upload, Trash2, Image } from 'lucide-react';

const compressImageFile = (file, maxWidth = 360, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new window.Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export const AthleteModal = ({ isOpen, onClose, athleteToEdit = null }) => {
  const { groups, addAthlete, updateAthlete } = useApp();
  const fileInputRef = useRef(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase">
                  Foto del Atleta
                </label>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[10px] text-slate-400 hover:text-white underline"
                >
                  {showUrlInput ? 'Cámara / Galería' : 'Pegar URL'}
                </button>
              </div>

              {/* Input de archivo oculto para activar Cámara o Galería */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsProcessingPhoto(true);
                  try {
                    const dataUrl = await compressImageFile(file);
                    setFormData(prev => ({ ...prev, photoUrl: dataUrl }));
                  } catch (err) {
                    console.error('Error al procesar foto:', err);
                  } finally {
                    setIsProcessingPhoto(false);
                  }
                }}
              />

              {showUrlInput ? (
                <input
                  type="url"
                  value={formData.photoUrl}
                  onChange={e => setFormData({ ...formData, photoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              ) : (
                <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700 rounded-xl p-2.5">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 shrink-0 border border-slate-600 flex items-center justify-center">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-semibold truncate">
                      {formData.photoUrl ? 'Foto seleccionada' : 'Sin foto cargada'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {isProcessingPhoto ? 'Optimizando imagen...' : 'Cámara o Galería del teléfono'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingPhoto}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 shadow transition-colors active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{formData.photoUrl ? 'Cambiar' : 'Subir'}</span>
                    </button>

                    {formData.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-600/30 text-slate-400 hover:text-red-400 transition-colors"
                        title="Quitar foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
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
