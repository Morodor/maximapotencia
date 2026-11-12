import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Crown, 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  Rocket, 
  Megaphone, 
  Database, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Search, 
  KeyRound, 
  Download, 
  Sparkles, 
  ExternalLink, 
  Smartphone, 
  RefreshCw, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  BarChart3,
  Calendar,
  Lock,
  Mail,
  UserCheck
} from 'lucide-react';
import { GROUP_COLORS } from '../athletes/GroupManagementModal';
import { DEFAULT_APK_URL, CURRENT_APP_VERSION } from '../../utils/updateManager';

export const AdminView = () => {
  const { 
    currentUser, 
    isSuperAdmin, 
    coaches, 
    groups, 
    athletes, 
    sessions, 
    rmRecords, 
    powerRecords, 
    exercises,
    addCoach, 
    updateCoach, 
    deleteCoach, 
    publishAppUpdate, 
    appUpdateInfo, 
    currentAppVersion, 
    updateAnnouncement,
    showNotification,
    setCurrentPanel
  } = useApp();

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'release' | 'broadcast' | 'telemetry'

  // ==================== ESTADO TAB 1: USUARIOS ====================
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingCoachId, setEditingCoachId] = useState(null);

  // Formulario Usuario / Entrenador
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('coach'); // 'super_admin' | 'head_coach' | 'coach' | 'assistant'
  const [title, setTitle] = useState('');
  const [pin, setPin] = useState('');
  const [color, setColor] = useState(GROUP_COLORS[1].hex);
  const [assignedGroupIds, setAssignedGroupIds] = useState([]);
  const [canViewAllAthletes, setCanViewAllAthletes] = useState(false);
  const [status, setStatus] = useState('active'); // 'active' | 'suspended'
  const [userToDelete, setUserToDelete] = useState(null);

  // ==================== ESTADO TAB 2: VERSIONES ====================
  const [releaseVersion, setReleaseVersion] = useState(CURRENT_APP_VERSION);
  const [releaseNotes, setReleaseNotes] = useState(
    appUpdateInfo?.releaseNotes || 
    '• Panel de Super Administrador Oficial integrado.\n• Gestión centralizada de usuarios, roles y permisos.\n• Acceso y registro con Google unificado en maximapotencia.web.app y Android.\n• Comunicados globales para la comunidad del gimnasio.'
  );
  const [downloadUrl, setDownloadUrl] = useState(appUpdateInfo?.downloadUrl || DEFAULT_APK_URL);
  const [isMandatory, setIsMandatory] = useState(Boolean(appUpdateInfo?.mandatory));
  const [publishing, setPublishing] = useState(false);

  // ==================== ESTADO TAB 3: COMUNICADOS ====================
  const [broadcastActive, setBroadcastActive] = useState(Boolean(appUpdateInfo?.announcement?.active));
  const [broadcastTitle, setBroadcastTitle] = useState(appUpdateInfo?.announcement?.title || '¡Nuevo Torneo de Fuerza y Potencia VBT!');
  const [broadcastMessage, setBroadcastMessage] = useState(
    appUpdateInfo?.announcement?.message || 
    'Este fin de semana realizaremos evaluaciones de 1RM y velocidad media propulsiva (VBT). Revisa tu cuadrilla asignada y prepárate con tu entrenador.'
  );
  const [broadcastType, setBroadcastType] = useState(appUpdateInfo?.announcement?.type || 'trophy');
  const [savingBroadcast, setSavingBroadcast] = useState(false);

  // Protección de acceso estricta para Super Admin
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-red-600/20 border-2 border-red-500/40 text-red-500 flex items-center justify-center mb-4 shadow-xl shadow-red-950/50">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Acceso Restringido</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          Esta consola está reservada exclusivamente para el <strong>Super Administrador General</strong> (bayron.quezada@gmail.com).
        </p>
        <button
          onClick={() => setCurrentPanel('dashboard')}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  // ==================== MANEJADORES DE USUARIOS ====================
  const handleOpenCreateUser = () => {
    setEditingCoachId(null);
    setName('');
    setEmail('');
    setRole('coach');
    setTitle('Entrenador de Cuadrilla');
    setPin('');
    setColor(GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)].hex);
    setAssignedGroupIds([]);
    setCanViewAllAthletes(false);
    setStatus('active');
    setIsEditingUser(true);
  };

  const handleOpenEditUser = (coach) => {
    setEditingCoachId(coach.id);
    setName(coach.name || '');
    setEmail(coach.email || '');
    setRole(coach.role || 'coach');
    setTitle(coach.title || '');
    setPin(coach.pin || '');
    setColor(coach.color || GROUP_COLORS[1].hex);
    setAssignedGroupIds(coach.assignedGroupIds || []);
    setCanViewAllAthletes(coach.canViewAllAthletes || false);
    setStatus(coach.status || 'active');
    setIsEditingUser(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      title: title.trim() || (role === 'head_coach' ? 'Head Coach' : role === 'super_admin' ? 'Super Admin' : 'Entrenador de Cuadrilla'),
      pin: pin.trim(),
      color,
      assignedGroupIds: (role === 'head_coach' || role === 'super_admin') ? [] : assignedGroupIds,
      canViewAllAthletes: (role === 'head_coach' || role === 'super_admin') ? true : canViewAllAthletes,
      status
    };

    let ok = false;
    if (editingCoachId) {
      ok = await updateCoach(editingCoachId, payload);
    } else {
      ok = await addCoach(payload);
    }

    if (ok) {
      setIsEditingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    const ok = await deleteCoach(userToDelete.id);
    if (ok) {
      setUserToDelete(null);
    }
  };

  // ==================== MANEJADOR DE ACTUALIZACIONES ====================
  const handlePublishRelease = async (e) => {
    e.preventDefault();
    if (!releaseVersion.trim()) return;

    setPublishing(true);
    const ok = await publishAppUpdate({
      latestVersion: releaseVersion.trim(),
      releaseNotes: releaseNotes.trim(),
      downloadUrl: downloadUrl.trim() || DEFAULT_APK_URL,
      mandatory: isMandatory
    });
    setPublishing(false);
  };

  // ==================== MANEJADOR DE COMUNICADOS ====================
  const handleSaveBroadcast = async (e) => {
    e.preventDefault();
    setSavingBroadcast(true);

    const announcementPayload = {
      id: `announcement_${Date.now()}`,
      active: broadcastActive,
      title: broadcastTitle.trim(),
      message: broadcastMessage.trim(),
      type: broadcastType,
      date: new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }),
      author: currentUser?.displayName || currentUser?.email || 'Super Admin'
    };

    await updateAnnouncement(announcementPayload);
    setSavingBroadcast(false);
  };

  // ==================== EXPORTACIÓN TOTAL DE RESPALDO ====================
  const handleExportFullBackup = () => {
    const fullBackup = {
      exportedAt: new Date().toISOString(),
      systemVersion: currentAppVersion,
      superAdmin: currentUser?.email,
      counts: {
        athletes: athletes.length,
        groups: groups.length,
        coaches: coaches.length,
        sessions: sessions.length,
        rmRecords: rmRecords.length,
        powerRecords: powerRecords.length,
        exercises: exercises.length
      },
      data: {
        athletes,
        groups,
        coaches,
        sessions,
        rmRecords,
        powerRecords,
        exercises
      }
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_maxima_potencia_total_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Copia de seguridad completa generada y descargada.');
  };

  // Filtrado de usuarios
  const filteredCoaches = coaches.filter(c => {
    const matchesSearch = 
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (roleFilter === 'all') return matchesSearch;
    return matchesSearch && c.role === roleFilter;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Cabecera Principal Super Admin */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-950/50 shrink-0">
              <Crown className="w-8 h-8 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                  Super Admin Console
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
                  v{currentAppVersion || '2.2.0'} Pro
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Panel de Control & Administración General
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Supervisión centralizada de usuarios, sincronización en tiempo real, control de versiones OTA y políticas de acceso.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-2xl text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Identidad Activa</span>
              <span className="text-xs font-bold text-amber-300 font-mono truncate block max-w-[200px]">
                {currentUser?.email}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Pestañas Super Admin */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-950/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuarios & Roles ({coaches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('release')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'release'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-950/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>Lanzamiento de Versiones</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'broadcast'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-950/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Comunicados Oficiales</span>
            {appUpdateInfo?.announcement?.active && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'telemetry'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-950/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Métricas & Respaldo Total</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: GESTIÓN DE USUARIOS & ROLES                       */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Barra de Filtros y Acción */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, correo o título..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">Todos los roles</option>
                <option value="head_coach">Head Coach</option>
                <option value="coach">Entrenador</option>
                <option value="assistant">Asistente</option>
              </select>
            </div>

            <button
              onClick={handleOpenCreateUser}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Entrenador / Usuario</span>
            </button>
          </div>

          {/* Directorio de Usuarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCoaches.map((coach) => {
              const isSuper = coach.name?.toLowerCase().includes('bayron') || coach.email?.toLowerCase().includes('bayron.quezada');
              const isCurrent = currentUser?.email && coach.email && currentUser.email.toLowerCase() === coach.email.toLowerCase();

              return (
                <div 
                  key={coach.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                    isSuper 
                      ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border-amber-500/40 shadow-lg' 
                      : coach.status === 'suspended'
                      ? 'bg-slate-950/60 border-red-950/40 opacity-70'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white shrink-0 shadow-md relative"
                          style={{ backgroundColor: coach.color || '#3b82f6' }}
                        >
                          {coach.name ? coach.name.substring(0, 2).toUpperCase() : 'CO'}
                          {isSuper && (
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow">
                              <Crown className="w-3 h-3 fill-slate-950" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-white truncate">{coach.name}</h4>
                            {isCurrent && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold">
                                Tú
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate">{coach.title || 'Entrenador'}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${
                        isSuper
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : coach.role === 'head_coach'
                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                          : coach.role === 'assistant'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {isSuper ? 'Super Admin' : coach.role === 'head_coach' ? 'Head Coach' : coach.role === 'assistant' ? 'Asistente' : 'Entrenador'}
                      </span>
                    </div>

                    {/* Detalles de cuenta */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate font-mono">
                          {coach.email || <span className="text-slate-600 italic">Sin correo vinculado</span>}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>
                          {coach.canViewAllAthletes 
                            ? 'Acceso a todos los atletas' 
                            : `${coach.assignedGroupIds?.length || 0} cuadrillas asignadas`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{coach.pin ? 'PIN de 4 dígitos activado' : 'Sin PIN de protección'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de gestión */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      coach.status === 'suspended'
                        ? 'bg-red-950/40 text-red-400 border border-red-800/40'
                        : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                    }`}>
                      {coach.status === 'suspended' ? 'Suspendido' : 'Activo'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditUser(coach)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Editar permisos y perfil"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {!isSuper && (
                        <button
                          onClick={() => setUserToDelete(coach)}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: LANZAMIENTO DE VERSIONES                          */}
      {/* ========================================================= */}
      {activeTab === 'release' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          {/* Formulario de Lanzamiento */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Publicar Nueva Versión en la Nube</h3>
                <p className="text-xs text-slate-400">
                  Notifica automáticamente a todos los dispositivos (Android y Web) para actualizar.
                </p>
              </div>
            </div>

            <form onSubmit={handlePublishRelease} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Número de Versión (SemVer)
                  </label>
                  <input
                    type="text"
                    required
                    value={releaseVersion}
                    onChange={(e) => setReleaseVersion(e.target.value)}
                    placeholder="2.2.0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Instalada en este equipo: <strong>v{currentAppVersion}</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    URL de Descarga APK Directo
                  </label>
                  <input
                    type="url"
                    required
                    value={downloadUrl}
                    onChange={(e) => setDownloadUrl(e.target.value)}
                    placeholder="https://github.com/.../Maxima_Potencia.apk"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Notas del Parche (Qué novedades incluye)
                </label>
                <textarea
                  rows={5}
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="• Novedad 1...&#10;• Corrección de bugs..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Actualización Obligatoria</h4>
                  <p className="text-[11px] text-slate-400">Si se activa, los usuarios no podrán posponer la instalación.</p>
                </div>
                <input
                  type="checkbox"
                  checked={isMandatory}
                  onChange={(e) => setIsMandatory(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={publishing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/40 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                <span>{publishing ? 'Transmitiendo a todos los dispositivos...' : 'Publicar y Notificar a Todos Ahora'}</span>
              </button>
            </form>
          </div>

          {/* Estado de la Nube */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Estado Remoto en Firestore</h4>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Versión Activa en la Red</span>
              <p className="text-xl font-black text-white font-mono">
                v{appUpdateInfo?.latestVersion || CURRENT_APP_VERSION}
              </p>
              <p className="text-xs text-slate-400">
                Lanzada: {appUpdateInfo?.releaseDate || 'Recientemente'}
              </p>
            </div>

            <div className="text-xs text-slate-400 space-y-2 pt-2">
              <p className="font-semibold text-white">Flujo de Actualización:</p>
              <p className="text-[11px] leading-relaxed">
                1. Al hacer clic en <strong>Publicar</strong>, Firestore emite un evento en tiempo real a todas las tablets y teléfonos activos.
              </p>
              <p className="text-[11px] leading-relaxed">
                2. Si un atleta o entrenador tiene una versión menor, verá el banner superior con opción de actualizar en 1 clic.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: COMUNICADOS GLOBALES                               */}
      {/* ========================================================= */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Avisos & Comunicados del Gimnasio</h3>
                <p className="text-xs text-slate-400">
                  Transmite noticias, campeonatos de fuerza, recordatorios o avisos a todos los usuarios.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveBroadcast} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Banner Comunitario Activo</h4>
                  <p className="text-[11px] text-slate-400">Muestra el comunicado en la pantalla principal de los usuarios.</p>
                </div>
                <input
                  type="checkbox"
                  checked={broadcastActive}
                  onChange={(e) => setBroadcastActive(e.target.checked)}
                  className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Estilo / Tipo de Mensaje
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'trophy', name: '🏆 Torneo / VBT', color: 'border-amber-500/40 text-amber-300' },
                    { id: 'info', name: '📢 Informativo', color: 'border-cyan-500/40 text-cyan-300' },
                    { id: 'alert', name: '⚠️ Alerta / Urgente', color: 'border-red-500/40 text-red-300' },
                    { id: 'success', name: '🎉 Felicitaciones', color: 'border-emerald-500/40 text-emerald-300' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBroadcastType(t.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        broadcastType === t.id
                          ? 'bg-slate-800 border-amber-400 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Título del Comunicado
                </label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="Ej. Evaluación de Potencia VBT este Sábado"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Mensaje Detallado
                </label>
                <textarea
                  rows={4}
                  required
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Detalles del aviso para atletas y entrenadores..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={savingBroadcast}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-950/40 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Megaphone className="w-4 h-4" />
                <span>{savingBroadcast ? 'Guardando en la nube...' : 'Guardar y Transmitir Comunicado'}</span>
              </button>
            </form>
          </div>

          {/* Vista previa en vivo */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Vista Previa en Vivo</h4>
            <p className="text-[11px] text-slate-400">Así es como verán el comunicado tus atletas y entrenadores:</p>

            <div className={`p-4 rounded-2xl border ${
              broadcastType === 'trophy' ? 'bg-amber-950/30 border-amber-500/40' :
              broadcastType === 'alert' ? 'bg-red-950/30 border-red-500/40' :
              broadcastType === 'success' ? 'bg-emerald-950/30 border-emerald-500/40' :
              'bg-blue-950/30 border-cyan-500/40'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                {broadcastType === 'trophy' ? '🏆 Competencia' : broadcastType === 'alert' ? '⚠️ Aviso' : broadcastType === 'success' ? '🎉 Comunidad' : '📢 Comunicado'}
              </span>
              <h5 className="text-sm font-bold text-white mb-1">{broadcastTitle || 'Sin título'}</h5>
              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{broadcastMessage || 'Sin contenido'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: MÉTRICAS & RESPALDO TOTAL                         */}
      {/* ========================================================= */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Tarjetas de Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Atletas', count: athletes.length, color: 'text-red-400', icon: Users },
              { label: 'Cuadrillas', count: groups.length, color: 'text-amber-400', icon: Layers },
              { label: 'Entrenadores', count: coaches.length, color: 'text-blue-400', icon: ShieldCheck },
              { label: 'Sesiones', count: sessions.length, color: 'text-emerald-400', icon: Activity },
              { label: 'Récords 1RM', count: rmRecords.length, color: 'text-purple-400', icon: BarChart3 },
              { label: 'Potencia VBT', count: powerRecords.length, color: 'text-cyan-400', icon: Sparkles }
            ].map((m, idx) => {
              const Icon = m.icon;
              return (
                <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
                  <Icon className={`w-5 h-5 ${m.color} mx-auto mb-1`} />
                  <span className="text-2xl font-black text-white font-mono block">{m.count}</span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{m.label}</span>
                </div>
              );
            })}
          </div>

          {/* Respaldo y Exportación */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Copia de Seguridad Integral (JSON)</h3>
                <p className="text-xs text-slate-400">
                  Descarga un archivo con toda la base de datos de atletas, récords, sesiones y cuadrillas para resguardo seguro.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-xs text-slate-400 space-y-1">
                <p>• Incluye {athletes.length} atletas, {sessions.length} sesiones completas y {rmRecords.length + powerRecords.length} mediciones biomecánicas.</p>
                <p>• Formato JSON estándar compatible con importación y auditorías de seguridad.</p>
              </div>

              <button
                onClick={handleExportFullBackup}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950/40 transition-all active:scale-95 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Backup Total Ahora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL EDITAR / CREAR USUARIO                             */}
      {/* ========================================================= */}
      {isEditingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingCoachId ? 'Editar Usuario / Permisos' : 'Añadir Nuevo Usuario'}
                  </h3>
                  <p className="text-xs text-slate-400">Asignación de roles y control de acceso</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingUser(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Rodrigo Tapia"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Correo Electrónico (Para Vincular con Google Login)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="entrenador@gmail.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Cuando este usuario inicie sesión con Google, se le asignarán estos permisos automáticamente.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Rol en el Gimnasio</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="head_coach">Head Coach (Control Total)</option>
                    <option value="coach">Entrenador de Cuadrilla</option>
                    <option value="assistant">Asistente / Preparador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Título Oficial</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Preparador Físico VBT"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">PIN de Seguridad (4 dígitos)</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Opcional"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Estado de Acceso</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="active">Activo (Acceso Permitido)</option>
                    <option value="suspended">Suspendido (Sin Acceso)</option>
                  </select>
                </div>
              </div>

              {/* Permiso global */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Ver y Gestionar Todos los Atletas</h4>
                  <p className="text-[11px] text-slate-400">Si se desactiva, solo verá sus cuadrillas asignadas abajo.</p>
                </div>
                <input
                  type="checkbox"
                  checked={canViewAllAthletes || role === 'head_coach'}
                  disabled={role === 'head_coach'}
                  onChange={(e) => setCanViewAllAthletes(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Asignación de Cuadrillas */}
              {role !== 'head_coach' && !canViewAllAthletes && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">
                    Cuadrillas / Grupos Asignados
                  </label>
                  {groups.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No hay cuadrillas registradas.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar p-1">
                      {groups.map((group) => {
                        const isAssigned = assignedGroupIds.includes(group.id);
                        return (
                          <div
                            key={group.id}
                            onClick={() => {
                              if (isAssigned) {
                                setAssignedGroupIds(assignedGroupIds.filter(id => id !== group.id));
                              } else {
                                setAssignedGroupIds([...assignedGroupIds, group.id]);
                              }
                            }}
                            className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                              isAssigned
                                ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <span className="font-bold">{group.name}</span>
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                              isAssigned ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700'
                            }`}>
                              {isAssigned && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingUser(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CONFIRMAR ELIMINAR USUARIO                         */}
      {/* ========================================================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">¿Eliminar a {userToDelete.name}?</h4>
              <p className="text-xs text-slate-400 mt-1">
                Esta acción removerá sus permisos de acceso y su perfil del gimnasio.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-950/40"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
