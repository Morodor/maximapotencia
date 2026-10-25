import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Crown, 
  ShieldCheck, 
  UserCheck, 
  KeyRound, 
  Check, 
  ArrowLeft,
  Users,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { GROUP_COLORS } from '../athletes/GroupManagementModal';

export const CoachManagementModal = ({ isOpen, onClose }) => {
  const { coaches, groups, addCoach, updateCoach, deleteCoach, isHeadCoach } = useApp();

  const [modalMode, setModalMode] = useState('list'); // 'list' | 'create' | 'edit'
  const [editingCoachId, setEditingCoachId] = useState(null);

  // Formulario
  const [name, setName] = useState('');
  const [role, setRole] = useState('coach'); // 'head_coach' | 'coach'
  const [title, setTitle] = useState('');
  const [pin, setPin] = useState('');
  const [color, setColor] = useState(GROUP_COLORS[1].hex);
  const [assignedGroupIds, setAssignedGroupIds] = useState([]);
  const [canViewAllAthletes, setCanViewAllAthletes] = useState(false);

  // Confirmar eliminación
  const [coachToDelete, setCoachToDelete] = useState(null);

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setEditingCoachId(null);
    setName('');
    setRole('coach');
    setTitle('Entrenador de Cuadrilla');
    setPin('');
    setColor(GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)].hex);
    setAssignedGroupIds([]);
    setCanViewAllAthletes(false);
    setModalMode('create');
  };

  const handleOpenEdit = (coach) => {
    setEditingCoachId(coach.id);
    setName(coach.name || '');
    setRole(coach.role || 'coach');
    setTitle(coach.title || '');
    setPin(coach.pin || '');
    setColor(coach.color || GROUP_COLORS[1].hex);
    setAssignedGroupIds(coach.assignedGroupIds || []);
    setCanViewAllAthletes(coach.canViewAllAthletes || false);
    setModalMode('edit');
  };

  const handleSaveCoach = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      role,
      title: title.trim() || (role === 'head_coach' ? 'Head Coach' : 'Entrenador de Cuadrilla'),
      pin: pin.trim(),
      color,
      assignedGroupIds: role === 'head_coach' ? [] : assignedGroupIds,
      canViewAllAthletes: role === 'head_coach' ? true : canViewAllAthletes
    };

    let ok = false;
    if (editingCoachId) {
      ok = await updateCoach(editingCoachId, payload);
    } else {
      ok = await addCoach(payload);
    }

    if (ok) {
      setModalMode('list');
    }
  };

  const toggleGroup = (id) => {
    if (assignedGroupIds.includes(id)) {
      setAssignedGroupIds(assignedGroupIds.filter(x => x !== id));
    } else {
      setAssignedGroupIds([...assignedGroupIds, id]);
    }
  };

  const handleConfirmDelete = async () => {
    if (coachToDelete) {
      await deleteCoach(coachToDelete.id);
      setCoachToDelete(null);
    }
  };

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

        {/* ---------------- VISTA 1: LISTADO DE COACHES ---------------- */}
        {modalMode === 'list' && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between pb-5 border-b border-slate-800 pr-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Equipo de Entrenadores & Roles</h3>
                  <p className="text-xs text-slate-400">
                    {coaches.length} {coaches.length === 1 ? 'coach registrado' : 'coaches registrados'} en el gimnasio
                  </p>
                </div>
              </div>

              {isHeadCoach && (
                <button
                  onClick={handleOpenCreate}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-lg shadow-red-950/40 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Coach</span>
                </button>
              )}
            </div>

            {/* Lista de Coaches con scroll */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-3">
              {coaches.map(c => {
                const isHead = c.role === 'head_coach';
                const assignedGroups = groups.filter(g => c.assignedGroupIds?.includes(g.id));

                return (
                  <div
                    key={c.id}
                    className="bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-start gap-3.5">
                      <div 
                        className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-md shrink-0 relative mt-0.5"
                        style={{ backgroundColor: c.color || '#ef4444' }}
                      >
                        {c.name.charAt(0).toUpperCase()}
                        {isHead && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center shadow">
                            <Crown className="w-3 h-3 fill-current" />
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">{c.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isHead
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                          }`}>
                            {isHead ? '👑 Head Coach' : '🏋️ Coach de Grupo'}
                          </span>
                          {c.pin && c.pin !== '' && (
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                              <KeyRound className="w-3 h-3 text-slate-400" />
                              <span>PIN</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 mt-0.5 font-medium">
                          {c.title}
                        </p>

                        {/* Cuadrillas a cargo */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {isHead ? (
                            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Acceso total a todas las cuadrillas y atletas
                            </span>
                          ) : assignedGroups.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Cuadrillas:</span>
                              {assignedGroups.map(g => (
                                <span
                                  key={g.id}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded border"
                                  style={{
                                    backgroundColor: `${g.color}15`,
                                    color: g.color,
                                    borderColor: `${g.color}35`
                                  }}
                                >
                                  {g.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">
                              Sin cuadrillas asignadas todavía
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isHeadCoach && (
                      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-700/40">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        {!(isHead && coaches.filter(x => x.role === 'head_coach').length <= 1) && (
                          <button
                            onClick={() => setCoachToDelete(c)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                            title="Eliminar entrenador"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------- VISTA 2: FORMULARIO CREAR / EDITAR ---------------- */}
        {(modalMode === 'create' || modalMode === 'edit') && (
          <form onSubmit={handleSaveCoach} className="flex flex-col h-full overflow-hidden space-y-4">
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
                {modalMode === 'create' ? 'Registrar Nuevo Entrenador' : 'Editar Entrenador'}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
              {/* Nombre y Cargo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej. Carlos Valenzuela"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Cargo / Especialidad
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ej. Entrenador de Halterofilia / Prep. Físico"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Selector de Rol */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Rango y Nivel de Acceso *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setRole('coach')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      role === 'coach'
                        ? 'bg-blue-500/10 border-blue-500/60 shadow-md'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-blue-400" />
                      <p className="font-bold text-white text-xs">Coach de Cuadrilla (Admin de Grupo)</p>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Gestiona a los atletas y entrenamientos de sus grupos asignados. Sin acceso a ajustes globales.
                    </p>
                  </div>

                  <div
                    onClick={() => setRole('head_coach')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      role === 'head_coach'
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-md'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <p className="font-bold text-white text-xs">Head Coach (Super Admin)</p>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Control total sobre todo el gimnasio, todos los atletas, cuadrillas, equipo de coaches y copias de seguridad.
                    </p>
                  </div>
                </div>
              </div>

              {/* PIN de Seguridad y Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>PIN de Acceso (4 Dígitos Opcional)</span>
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Dejar vacío para entrar sin PIN"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Protege el perfil en la tablet del gimnasio para que otros no modifiquen sus series.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Color de Avatar
                  </label>
                  <div className="flex flex-wrap items-center gap-2 bg-slate-800/60 p-2 rounded-xl border border-slate-700/60">
                    {GROUP_COLORS.map(c => (
                      <button
                        type="button"
                        key={c.hex}
                        onClick={() => setColor(c.hex)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          color === c.hex ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {color === c.hex && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Asignación de Cuadrillas (solo si es coach de grupo) */}
              {role === 'coach' && (
                <div className="border border-slate-800 bg-slate-950/60 rounded-2xl p-4 space-y-3">
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">
                      Cuadrillas Asignadas ({assignedGroupIds.length} de {groups.length})
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Selecciona los grupos de trabajo que este entrenador administrará.
                    </p>
                  </div>

                  {groups.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No hay grupos de trabajo creados todavía.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {groups.map(grp => {
                        const isAssigned = assignedGroupIds.includes(grp.id);
                        return (
                          <div
                            key={grp.id}
                            onClick={() => toggleGroup(grp.id)}
                            className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                              isAssigned
                                ? 'bg-slate-800 border-slate-600'
                                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: grp.color }} 
                              />
                              <span className="text-xs font-bold text-white">{grp.name}</span>
                            </div>

                            <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                              isAssigned 
                                ? 'bg-red-600 border-red-500 text-white' 
                                : 'border-slate-700 bg-slate-800 text-transparent'
                            }`}>
                              <Check className="w-3 h-3" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Permiso de solo lectura para otros atletas */}
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="viewAllAthletesCheck"
                      checked={canViewAllAthletes}
                      onChange={e => setCanViewAllAthletes(e.target.checked)}
                      className="w-4 h-4 rounded accent-red-600 cursor-pointer"
                    />
                    <label htmlFor="viewAllAthletesCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                      Permitir ver a todos los atletas del gimnasio en modo solo lectura (para consultar récords)
                    </label>
                  </div>
                </div>
              )}
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
                {modalMode === 'create' ? 'Registrar Entrenador' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}

        {/* Modal confirmación para eliminar */}
        {coachToDelete && (
          <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-6 rounded-3xl animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">¿Eliminar a {coachToDelete.name}?</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Se eliminará su perfil de entrenador del gimnasio. Los atletas y registros de sus grupos no se verán afectados.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => setCoachToDelete(null)}
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
