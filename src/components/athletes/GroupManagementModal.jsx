import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  Calendar, 
  Search, 
  ShieldCheck, 
  ArrowLeft,
  Sparkles,
  Layers,
  Crown,
  UserCheck
} from 'lucide-react';

export const GROUP_COLORS = [
  { name: 'Rojo Furia', hex: '#ef4444', class: 'bg-red-500' },
  { name: 'Azul Olímpico', hex: '#3b82f6', class: 'bg-blue-500' },
  { name: 'Esmeralda Élite', hex: '#10b981', class: 'bg-emerald-500' },
  { name: 'Ámbar Potencia', hex: '#f59e0b', class: 'bg-amber-500' },
  { name: 'Púrpura Fuerza', hex: '#8b5cf6', class: 'bg-purple-500' },
  { name: 'Rosa Juveniles', hex: '#ec4899', class: 'bg-pink-500' },
  { name: 'Cian Velocidad', hex: '#06b6d4', class: 'bg-cyan-500' },
  { name: 'Naranja Rugby', hex: '#f97316', class: 'bg-orange-500' },
];

export const GroupManagementModal = ({ isOpen, onClose }) => {
  const { athletes, groups, coaches, addGroup, updateGroup, deleteGroup } = useApp();

  // Modo: 'list' | 'create' | 'edit'
  const [modalMode, setModalMode] = useState('list');
  const [editingGroupId, setEditingGroupId] = useState(null);

  // Formulario
  const [groupName, setGroupName] = useState('');
  const [groupColor, setGroupColor] = useState(GROUP_COLORS[0].hex);
  const [groupDescription, setGroupDescription] = useState('');
  const [groupSchedule, setGroupSchedule] = useState('');
  const [assignedCoachId, setAssignedCoachId] = useState('');
  const [selectedAthleteIds, setSelectedAthleteIds] = useState([]);
  const [athleteSearch, setAthleteSearch] = useState('');

  // Confirmación de borrado
  const [groupToDelete, setGroupToDelete] = useState(null);

  if (!isOpen) return null;

  // Iniciar creación de nuevo grupo
  const handleOpenCreate = () => {
    setEditingGroupId(null);
    setGroupName('');
    setGroupColor(GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)].hex);
    setGroupDescription('');
    setGroupSchedule('');
    setAssignedCoachId('');
    setSelectedAthleteIds([]);
    setAthleteSearch('');
    setModalMode('create');
  };

  // Iniciar edición de grupo existente
  const handleOpenEdit = (grp) => {
    setEditingGroupId(grp.id);
    setGroupName(grp.name || '');
    setGroupColor(grp.color || GROUP_COLORS[0].hex);
    setGroupDescription(grp.description || '');
    setGroupSchedule(grp.schedule || '');
    setAssignedCoachId(grp.coachId || '');
    // Obtener atletas asignados al grupo
    const members = athletes
      .filter(a => (a.groupIds && a.groupIds.includes(grp.id)) || (grp.athleteIds && grp.athleteIds.includes(a.id)))
      .map(a => a.id);
    setSelectedAthleteIds(members);
    setAthleteSearch('');
    setModalMode('edit');
  };

  // Guardar grupo (crear o actualizar)
  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const payload = {
      name: groupName.trim(),
      color: groupColor,
      description: groupDescription.trim(),
      schedule: groupSchedule.trim(),
      coachId: assignedCoachId || null,
      athleteIds: selectedAthleteIds
    };

    let ok = false;
    if (editingGroupId) {
      ok = await updateGroup(editingGroupId, payload);
    } else {
      ok = await addGroup(payload);
    }

    if (ok) {
      setModalMode('list');
    }
  };

  // Toggle de atleta
  const toggleAthlete = (id) => {
    if (selectedAthleteIds.includes(id)) {
      setSelectedAthleteIds(selectedAthleteIds.filter(x => x !== id));
    } else {
      setSelectedAthleteIds([...selectedAthleteIds, id]);
    }
  };

  // Seleccionar o deseleccionar todos
  const handleSelectAll = () => {
    if (selectedAthleteIds.length === athletes.length) {
      setSelectedAthleteIds([]);
    } else {
      setSelectedAthleteIds(athletes.map(a => a.id));
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (groupToDelete) {
      await deleteGroup(groupToDelete.id);
      setGroupToDelete(null);
    }
  };

  // Atletas filtrados por buscador
  const filteredAthletes = athletes.filter(a => 
    (a.name || '').toLowerCase().includes(athleteSearch.toLowerCase()) ||
    (a.nickname || '').toLowerCase().includes(athleteSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ---------------- VISTA 1: LISTADO DE GRUPOS ---------------- */}
        {modalMode === 'list' && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between pb-5 border-b border-slate-800 pr-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Grupos de Trabajo & Cuadrillas</h3>
                  <p className="text-xs text-slate-400">
                    {groups.length} {groups.length === 1 ? 'grupo registrado' : 'grupos registrados'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-lg shadow-red-950/40 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Grupo</span>
              </button>
            </div>

            {/* Lista de Grupos con scroll */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-3">
              {groups.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                    <Users className="w-8 h-8" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h4 className="text-base font-bold text-white">No hay grupos de trabajo creados</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Crea cuadrillas para organizar a tus atletas por disciplinas (ej. Halterofilia, Rugby, Juveniles) o turnos de entrenamiento.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-950/40 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear mi primer grupo</span>
                  </button>
                </div>
              ) : (
                groups.map(grp => {
                  const memberAthletes = athletes.filter(a => 
                    (a.groupIds && a.groupIds.includes(grp.id)) || 
                    (grp.athleteIds && grp.athleteIds.includes(a.id))
                  );

                  return (
                    <div
                      key={grp.id}
                      className="bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-start gap-3.5">
                        <div 
                          className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-md shrink-0 mt-0.5"
                          style={{ backgroundColor: grp.color || '#ef4444' }}
                        >
                          {(grp.name || 'G').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white">{grp.name}</h4>
                            <span 
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                              style={{ 
                                backgroundColor: `${grp.color}15`, 
                                color: grp.color, 
                                borderColor: `${grp.color}40` 
                              }}
                            >
                              {memberAthletes.length} {memberAthletes.length === 1 ? 'atleta' : 'atletas'}
                            </span>
                          </div>

                          {grp.schedule && (
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              <span>{grp.schedule}</span>
                            </p>
                          )}

                          {grp.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
                              {grp.description}
                            </p>
                          )}

                          {grp.coachId && (() => {
                            const c = coaches.find(x => x.id === grp.coachId);
                            if (!c) return null;
                            return (
                              <p className="text-[11px] text-blue-400 font-semibold flex items-center gap-1 mt-1">
                                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                                <span>Coach: {c.name}</span>
                              </p>
                            );
                          })()}

                          {/* Avatares de atletas miembros */}
                          {memberAthletes.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2.5">
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {memberAthletes.slice(0, 4).map(ath => (
                                  <div
                                    key={ath.id}
                                    title={ath.name}
                                    className="w-6 h-6 rounded-full bg-slate-700 border border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm overflow-hidden"
                                  >
                                    {ath.photoUrl ? (
                                      <img src={ath.photoUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      ath.name.charAt(0)
                                    )}
                                  </div>
                                ))}
                              </div>
                              {memberAthletes.length > 4 && (
                                <span className="text-[10px] font-bold text-slate-400">
                                  +{memberAthletes.length - 4} más
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-700/40">
                        <button
                          onClick={() => handleOpenEdit(grp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => setGroupToDelete(grp)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                          title="Eliminar grupo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ---------------- VISTA 2: FORMULARIO CREAR / EDITAR ---------------- */}
        {(modalMode === 'create' || modalMode === 'edit') && (
          <form onSubmit={handleSaveGroup} className="flex flex-col h-full overflow-hidden space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                type="button"
                onClick={() => setModalMode('list')}
                className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a la lista</span>
              </button>
              <h3 className="text-lg font-bold text-white">
                {modalMode === 'create' ? 'Crear Nuevo Grupo de Trabajo' : 'Editar Grupo de Trabajo'}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
              {/* Nombre del Grupo */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre del Grupo / Categoría *
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="Ej. Halterofilia Olímpica, Fuerza Sub-20, Turno Mañana..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Selector de Color de Etiqueta */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Color Identificador de Etiqueta
                </label>
                <div className="flex flex-wrap items-center gap-2.5 bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/60">
                  {GROUP_COLORS.map(c => {
                    const isSelected = groupColor === c.hex;
                    return (
                      <button
                        type="button"
                        key={c.hex}
                        onClick={() => setGroupColor(c.hex)}
                        title={c.name}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 shadow-lg' : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horario y Descripción */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Horario / Días (Opcional)
                  </label>
                  <input
                    type="text"
                    value={groupSchedule}
                    onChange={e => setGroupSchedule(e.target.value)}
                    placeholder="Ej. Lun-Mié-Vie 08:00 - 09:30"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Descripción / Enfoque (Opcional)
                  </label>
                  <input
                    type="text"
                    value={groupDescription}
                    onChange={e => setGroupDescription(e.target.value)}
                    placeholder="Ej. Levantadores que preparan el nacional"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Entrenador Encargado de la Cuadrilla */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Coach / Entrenador Encargado de la Cuadrilla</span>
                </label>
                <select
                  value={assignedCoachId}
                  onChange={e => setAssignedCoachId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                >
                  <option value="">Sin entrenador exclusivo (Administrado por Head Coach)</option>
                  {coaches.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.role === 'head_coach' ? '(👑 Head Coach)' : `(${c.title || 'Coach'})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asignación Múltiple de Atletas */}
              <div className="border border-slate-800 bg-slate-950/60 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">
                      Atletas Asignados ({selectedAthleteIds.length} de {athletes.length})
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Selecciona los atletas que formarán parte de este grupo de trabajo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-bold text-red-400 hover:text-red-300 self-start sm:self-auto"
                  >
                    {selectedAthleteIds.length === athletes.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                  </button>
                </div>

                {/* Buscador de Atletas */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={athleteSearch}
                    onChange={e => setAthleteSearch(e.target.value)}
                    placeholder="Filtrar atletas por nombre..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                {/* Lista de Atletas */}
                <div className="max-h-48 overflow-y-auto custom-scrollbar divide-y divide-slate-800/60 pr-1">
                  {filteredAthletes.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No hay atletas que coincidan.</p>
                  ) : (
                    filteredAthletes.map(ath => {
                      const isSelected = selectedAthleteIds.includes(ath.id);
                      return (
                        <div
                          key={ath.id}
                          onClick={() => toggleAthlete(ath.id)}
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                            isSelected ? 'bg-red-500/10' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
                              {ath.photoUrl ? (
                                <img src={ath.photoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                ath.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{ath.name}</p>
                              {ath.nickname && (
                                <p className="text-[10px] text-slate-400">"{ath.nickname}"</p>
                              )}
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                            isSelected 
                              ? 'bg-red-600 border-red-500 text-white shadow-sm' 
                              : 'border-slate-700 bg-slate-800 text-transparent'
                          }`}>
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Footer con botones */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalMode('list')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-950/40 transition-all active:scale-95"
              >
                {modalMode === 'create' ? 'Crear Grupo' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}

        {/* Modal de confirmación para eliminar */}
        {groupToDelete && (
          <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-6 rounded-3xl animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">¿Eliminar este grupo?</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Se eliminará el grupo <strong className="text-white">"{groupToDelete.name}"</strong>. Los atletas no serán borrados, solo desvinculados de este grupo.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => setGroupToDelete(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-950/40"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
