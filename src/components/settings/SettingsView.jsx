import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Settings, 
  Download, 
  Upload, 
  Shield, 
  Save, 
  Database, 
  Crown, 
  Users, 
  KeyRound, 
  ShieldCheck, 
  Rocket, 
  RefreshCw, 
  Smartphone, 
  CheckCircle2, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Palette,
  Check,
  Zap,
  Radio,
  SlidersHorizontal,
  Building2,
  Copy,
  User,
  LogIn,
  LogOut,
  HardDrive
} from 'lucide-react';
import { CoachManagementModal } from '../coaches/CoachManagementModal';
import { GoogleIcon } from '../auth/AuthModal';
import { DEFAULT_APK_URL, CURRENT_APP_VERSION } from '../../utils/updateManager';
import { getSuiteConfig, saveSuiteConfig, checkSpeedTrackerInstalled, launchSpeedTracker } from '../../utils/suiteLauncher';

export const SettingsView = () => {
  const { 
    athletes, 
    groups,
    rmRecords, 
    powerRecords, 
    sessions, 
    exercises, 
    coaches,
    currentCoach,
    isHeadCoach,
    updateCoach,
    showNotification,
    currentAppVersion,
    appUpdateInfo,
    hasUpdateAvailable,
    publishAppUpdate,
    checkForUpdatesManual,
    setIsUpdateModalOpen,
    downloadAndInstallUpdate,
    appTheme,
    changeTheme,
    availableThemes,
    activeGymId,
    switchGym,
    resetDefaultGym,
    currentUser,
    setIsAuthModalOpen,
    logout,
    isGuestMode,
    toggleGuestMode,
    migrateGuestDataToCloud
  } = useApp();

  const [inputGymId, setInputGymId] = useState(activeGymId || '');

  useEffect(() => {
    setInputGymId(activeGymId || '');
  }, [activeGymId]);

  const [coachName, setCoachName] = useState('');
  const [coachTitle, setCoachTitle] = useState('');
  const [coachPin, setCoachPin] = useState('');
  const [isManageCoachesOpen, setIsManageCoachesOpen] = useState(false);

  // Estados para Publicación de Actualizaciones (Solo Head Coach)
  const [showPublisher, setShowPublisher] = useState(false);
  const [pubVersion, setPubVersion] = useState(CURRENT_APP_VERSION);
  const [pubUrl, setPubUrl] = useState(DEFAULT_APK_URL);
  const [pubNotes, setPubNotes] = useState('');
  const [pubMandatory, setPubMandatory] = useState(false);

  // Estados para Ecosistema Suite (Speed Tracker)
  const [suiteConfig, setSuiteConfig] = useState(getSuiteConfig());
  const [suitePackage, setSuitePackage] = useState('');
  const [suiteScheme, setSuiteScheme] = useState('');
  const [suiteWebUrl, setSuiteWebUrl] = useState('');
  const [suiteSavedMsg, setSuiteSavedMsg] = useState(false);
  const [suiteTestingMsg, setSuiteTestingMsg] = useState(null);

  useEffect(() => {
    if (currentCoach) {
      setCoachName(currentCoach.name || '');
      setCoachTitle(currentCoach.title || '');
      setCoachPin(currentCoach.pin || '');
    }
  }, [currentCoach]);

  useEffect(() => {
    if (appUpdateInfo) {
      setPubVersion(appUpdateInfo.latestVersion || CURRENT_APP_VERSION);
      setPubUrl(appUpdateInfo.downloadUrl || DEFAULT_APK_URL);
      setPubNotes(appUpdateInfo.releaseNotes || '');
      setPubMandatory(Boolean(appUpdateInfo.mandatory));
    }
  }, [appUpdateInfo]);

  useEffect(() => {
    const cfg = getSuiteConfig();
    setSuiteConfig(cfg);
    setSuitePackage(cfg.speedTracker?.packageName || 'com.speedtracker');
    setSuiteScheme(cfg.speedTracker?.scheme || 'speedtracker://');
    setSuiteWebUrl(cfg.speedTracker?.webUrl || 'https://speedtracker.web.app');
  }, []);

  const handleSaveSuiteConfig = (e) => {
    e.preventDefault();
    const updated = {
      ...suiteConfig,
      speedTracker: {
        ...suiteConfig.speedTracker,
        packageName: suitePackage.trim() || 'com.speedtracker',
        scheme: suiteScheme.trim() || 'speedtracker://',
        webUrl: suiteWebUrl.trim() || 'https://speedtracker.web.app'
      }
    };
    saveSuiteConfig(updated);
    setSuiteConfig(updated);
    setSuiteSavedMsg(true);
    setTimeout(() => setSuiteSavedMsg(false), 3000);
  };

  const handleTestSpeedTracker = async () => {
    setSuiteTestingMsg({ loading: true, text: 'Probando enlace con Speed Tracker...' });
    const res = await launchSpeedTracker({
      athleteName: currentCoach?.name || 'Coach Test',
      exercise: 'Sentadilla Test',
      load: 100
    });
    if (res.success) {
      setSuiteTestingMsg({ success: true, text: '¡Speed Tracker iniciado correctamente!' });
    } else {
      setSuiteTestingMsg({ error: true, text: res.message || 'No se pudo abrir automáticamente. Verifica el ID o instalación.' });
    }
    setTimeout(() => setSuiteTestingMsg(null), 4000);
  };

  const handleSaveCurrentCoach = async () => {
    if (!currentCoach?.id) return;
    await updateCoach(currentCoach.id, {
      name: coachName,
      title: coachTitle,
      pin: coachPin
    });
  };

  const handlePublishUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!pubVersion.trim()) return;
    await publishAppUpdate({
      latestVersion: pubVersion,
      downloadUrl: pubUrl,
      releaseNotes: pubNotes,
      mandatory: pubMandatory
    });
  };

  // Exportar backup completo
  const handleExportFullBackup = () => {
    const fullBackup = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      coaches,
      groups,
      athletes,
      rmRecords,
      powerRecords,
      sessions,
      exercises
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `maxima_potencia_backup_total_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Copia de seguridad descargada.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Sección 0: Cuenta de Usuario & Firebase Auth */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-red-500" />
              <span>Cuenta & Sesión de Usuario</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inicia sesión con tu correo electrónico para sincronizar y respaldar tu identidad de Coach / Admin en la nube de Firebase.
            </p>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 active:scale-95"
              >
                Ver Mi Perfil
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-950/40 transition-all active:scale-95 shrink-0"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión / Registrarse</span>
            </button>
          )}
        </div>

        {currentUser ? (
          <div className="space-y-3">
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-base shrink-0">
                  {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{currentUser.displayName || 'Usuario de Máxima Potencia'}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Sincronizado en la Nube
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser.email}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">UID: {currentUser.uid}</p>
                </div>
              </div>
              <div className="text-left sm:text-right text-[11px] text-slate-400">
                <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Método de Acceso</span>
                <span className="font-semibold text-slate-300 inline-flex items-center gap-1.5 mt-0.5">
                  {currentUser.providerData?.[0]?.providerId === 'google.com' ? (
                    <>
                      <GoogleIcon className="w-3.5 h-3.5" />
                      <span>Google Account</span>
                    </>
                  ) : (
                    <span>Email & Contraseña</span>
                  )}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={migrateGuestDataToCloud}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all active:scale-95"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Sincronizar mis registros locales de invitado con la base central</span>
            </button>
          </div>
        ) : isGuestMode ? (
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Modo Invitado Activo</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                    Solo LocalStorage
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tus atletas, 1RM y sesiones se guardan solo en la memoria de este teléfono y NO se actualizan en la nube.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleGuestMode}
                className="text-xs font-bold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-all"
              >
                Desactivar Invitado
              </button>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 underline"
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-700/60 border border-slate-600 flex items-center justify-center text-slate-400 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Modo Solo Lectura (Sin Sesión Iniciada)</p>
                <p className="text-xs text-slate-400">Por seguridad, para registrar atletas o sesiones debes iniciar sesión o activar el Modo Invitado.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleGuestMode}
                className="text-xs font-bold px-3.5 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl transition-all active:scale-95"
              >
                Activar Modo Invitado
              </button>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs font-bold text-red-400 hover:text-red-300 underline"
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sección 1: Equipo de Entrenadores y Jerarquía (RBAC) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Jerarquía & Equipo de Entrenadores</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Administra los rangos entre Head Coach y entrenadores encargados de cada cuadrilla.
            </p>
          </div>

          {isHeadCoach && (
            <button
              onClick={() => setIsManageCoachesOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-950/40 transition-all active:scale-95 shrink-0"
            >
              <Users className="w-4 h-4" />
              <span>Gestionar Coaches ({coaches.length})</span>
            </button>
          )}
        </div>

        {/* Resumen del equipo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Tu Rol Actual</span>
            <p className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
              {isHeadCoach ? (
                <>
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Head Coach (Super Admin)</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Coach de Cuadrilla</span>
                </>
              )}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {isHeadCoach ? 'Control de todo el gimnasio' : `${currentCoach?.assignedGroupIds?.length || 0} cuadrillas asignadas`}
            </p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Entrenadores Registrados</span>
            <p className="text-2xl font-black text-white mt-1 font-mono">{coaches.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {coaches.filter(c => c.role === 'head_coach').length} Head Coach • {coaches.filter(c => c.role === 'coach').length} de Grupo
            </p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Grupos / Cuadrillas</span>
            <p className="text-2xl font-black text-white mt-1 font-mono">{groups.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {athletes.length} Atletas asignables
            </p>
          </div>
        </div>
      </div>

      {/* Sección 2: Mi Perfil de Entrenador Activo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4 shadow-xl">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" />
          <span>Mi Perfil ({currentCoach?.name})</span>
        </h3>
        <p className="text-xs text-slate-400">
          Ajusta tu nombre, cargo visible en la cabecera y PIN numérico de acceso rápido.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Nombre
            </label>
            <input
              type="text"
              value={coachName}
              onChange={e => setCoachName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Descripción / Cargo
            </label>
            <input
              type="text"
              value={coachTitle}
              onChange={e => setCoachTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>PIN de Acceso (4 dígitos)</span>
            </label>
            <input
              type="password"
              maxLength={4}
              value={coachPin}
              onChange={e => setCoachPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Sin PIN (acceso libre)"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <button
          onClick={handleSaveCurrentCoach}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors mt-2"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Mi Perfil</span>
        </button>
      </div>

      {/* Sección: Paleta de Color y Personalización Visual */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-red-500" />
              <span>Paleta de Color y Personalización</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Personaliza el color de acento y el color de fondo ambiental de toda la aplicación.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400 px-3 py-1 bg-slate-800/80 rounded-xl border border-slate-700 w-fit">
            Tema Activo: <strong className="text-white capitalize">{availableThemes?.find(t => t.id === appTheme)?.name || appTheme}</strong>
          </span>
        </div>

        {/* Selector Desplegable de Temas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Lista Desplegable de Temas
            </label>
            <div className="relative">
              <select
                value={appTheme || 'red'}
                onChange={e => changeTheme(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none pr-10 cursor-pointer shadow-md"
              >
                {availableThemes?.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white py-2">
                    {t.name} — {t.environmentName || t.subtitle}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Cambia inmediatamente el acento y el fondo de toda la aplicación.
            </span>
          </div>

          {/* Pastillas rápidas */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Acceso Rápido por Muestra
            </label>
            <div className="flex flex-wrap gap-2">
              {availableThemes?.map(t => {
                const isSelected = (appTheme || 'red') === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => changeTheme(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all ${
                      isSelected 
                        ? 'border-white text-white ring-2 ring-red-500 shadow-md scale-105'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
                    }`}
                    style={{
                      backgroundColor: isSelected ? t.surfaceHex : undefined
                    }}
                  >
                    <span className="w-3 h-3 rounded-full border border-black/40" style={{ backgroundColor: t.colorHex }} />
                    <span>{t.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tarjeta de Vista Previa en Vivo */}
        {(() => {
          const activeThemeObj = availableThemes?.find(t => t.id === (appTheme || 'red')) || availableThemes?.[0];
          if (!activeThemeObj) return null;

          return (
            <div className="p-5 rounded-2xl border border-slate-700/80 bg-slate-950/80 shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-2xl shadow-lg flex items-center justify-center border-2 border-slate-800 shrink-0"
                    style={{ backgroundColor: activeThemeObj.colorHex }}
                  >
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">{activeThemeObj.name}</h4>
                      <span 
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-xs"
                        style={{ backgroundColor: activeThemeObj.colorHex }}
                      >
                        Vista Previa Activa
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{activeThemeObj.environmentName || activeThemeObj.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Atmósfera de Color</span>
                    <div className="flex items-center gap-1.5 sm:justify-end mt-0.5">
                      <span className="w-4 h-4 rounded-full border border-slate-600 shadow" style={{ backgroundColor: activeThemeObj.bgHex }} title="Fondo general" />
                      <span className="w-4 h-4 rounded-full border border-slate-600 shadow" style={{ backgroundColor: activeThemeObj.surfaceHex }} title="Tarjetas" />
                      <span className="w-4 h-4 rounded-full border border-slate-600 shadow" style={{ backgroundColor: activeThemeObj.colorHex }} title="Acento" />
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {activeThemeObj.description}
              </p>

              {/* Muestra de Componentes Reales con el Color de Acento y Fondo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 flex flex-col justify-between gap-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Botón de Acción</span>
                  <button 
                    type="button"
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-transform"
                    style={{ backgroundColor: activeThemeObj.colorHex }}
                  >
                    Registrar Serie 🏋️
                  </button>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 flex flex-col justify-between gap-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Insignia y Métrica VBT</span>
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-xs font-bold px-2.5 py-1 rounded-lg text-white shadow-xs"
                      style={{ backgroundColor: activeThemeObj.colorHex }}
                    >
                      0.85 m/s
                    </span>
                    <span className="text-xs font-bold text-slate-200 font-mono">140 kg (85%)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 flex flex-col justify-between gap-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Fondo y Superficie</span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Tono:</span>
                    <span className="font-bold text-white font-mono">{activeThemeObj.bgHex}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Sección 3: Centro de Actualizaciones del Sistema */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Rocket className="w-5 h-5 text-red-500" />
              <span>Actualizaciones del Sistema</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Control de versiones oficiales de Máxima Potencia para Android y tablets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-800 text-slate-300 rounded-xl border border-slate-700">
              Instalada: v{currentAppVersion}
            </span>
            <button
              onClick={checkForUpdatesManual}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
              title="Comprobar en la nube"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Comprobar</span>
            </button>
          </div>
        </div>

        {/* Estado de la Actualización */}
        {hasUpdateAvailable ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 to-amber-950/40 border border-red-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shrink-0 shadow-lg shadow-red-950/50 mt-0.5">
                <Rocket className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-black text-white flex items-center gap-2">
                  <span>¡Nueva versión oficial v{appUpdateInfo?.latestVersion} disponible!</span>
                  <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-sans">
                    Recomendada
                  </span>
                </p>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                  {appUpdateInfo?.releaseNotes?.split('\n')[0] || 'Correcciones de interfaz móvil y nuevas optimizaciones de rendimiento.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsUpdateModalOpen(true)}
              className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-red-950/40 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Instalar v{appUpdateInfo?.latestVersion}</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center gap-3 text-xs text-slate-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white">Tu aplicación está al día (v{currentAppVersion})</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Tienes instalada la versión más reciente con todas las mejoras de visualización y análisis científico.
              </p>
            </div>
          </div>
        )}

        {/* Panel de Publicación para Head Coach */}
        {isHeadCoach && (
          <div className="border-t border-slate-800/80 pt-3">
            <button
              type="button"
              onClick={() => setShowPublisher(!showPublisher)}
              className="flex items-center justify-between w-full text-left py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Publicar Nueva Actualización para Todos los Dispositivos (Solo Head Coach)</span>
              </span>
              {showPublisher ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showPublisher && (
              <form onSubmit={handlePublishUpdateSubmit} className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 animate-in fade-in">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Cuando compiles un nuevo APK o tengas un enlace de descarga (en Google Drive, Dropbox, Firebase Hosting o GitHub), publícalo aquí.
                  <strong> Inmediatamente todos los móviles y tablets con la app recibirán la notificación de actualización sin necesidad de enviarles el archivo a cada uno por WhatsApp.</strong>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase">
                      Número de Versión *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 2.0.2"
                      value={pubVersion}
                      onChange={e => setPubVersion(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase">
                      Enlace de Descarga Directa del APK *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://.../Maxima_Potencia.apk"
                      value={pubUrl}
                      onChange={e => setPubUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase">
                    Novedades y Cambios en esta Versión
                  </label>
                  <textarea
                    rows="3"
                    placeholder="• Corrección de márgenes y botones en móvil...&#10;• Nuevas opciones de análisis VBT..."
                    value={pubNotes}
                    onChange={e => setPubNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={pubMandatory}
                      onChange={e => setPubMandatory(e.target.checked)}
                      className="rounded border-slate-700 text-red-600 focus:ring-red-500 bg-slate-900"
                    />
                    <span>Actualización obligatoria</span>
                  </label>

                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-lg shadow-red-950/40 transition-all active:scale-95"
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Publicar Actualización Ahora</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Sección 4: Ecosistema Suite Máxima Potencia (Speed Tracker) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5 fill-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">Ecosistema Suite Máxima Potencia</h3>
                <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 font-bold px-2.5 py-0.5 rounded-full">
                  Speed Tracker
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Vinculación de aplicaciones hermanas para medición cinemática y análisis de levantamientos.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveSuiteConfig} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
                ID de Paquete Android (Package Name)
              </label>
              <input
                type="text"
                value={suitePackage}
                onChange={e => setSuitePackage(e.target.value)}
                placeholder="com.speedtracker"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Nombre de paquete con el que compilaste tu app Speed Tracker.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
                Esquema URI (Deep Link)
              </label>
              <input
                type="text"
                value={suiteScheme}
                onChange={e => setSuiteScheme(e.target.value)}
                placeholder="speedtracker://"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Permite enviar atleta, ejercicio y carga directamente.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
              URL Web / Descarga Alternativa
            </label>
            <input
              type="url"
              value={suiteWebUrl}
              onChange={e => setSuiteWebUrl(e.target.value)}
              placeholder="https://speedtracker.web.app"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {suiteSavedMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Configuración de Suite guardada correctamente.</span>
            </div>
          )}

          {suiteTestingMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
              suiteTestingMsg.success
                ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                : suiteTestingMsg.error
                ? 'bg-amber-950/40 border border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border border-slate-700 text-slate-300'
            }`}>
              {suiteTestingMsg.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
              <span>{suiteTestingMsg.text}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestSpeedTracker}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Probar Enlace con Speed Tracker</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-red-950/40 transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Configuración de Suite</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sección 5: Espacio de Trabajo / Gimnasio Multi-Tenancy */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">Espacio de Trabajo / Gimnasio</h3>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold px-2 py-0.5 rounded-full">
                  Multi-Club
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cada gimnasio cuenta con su propia base de datos aislada e independiente en la nube.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
              ID del Gimnasio Activo
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputGymId}
                onChange={e => setInputGymId(e.target.value)}
                placeholder="ID de gimnasio..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(inputGymId);
                  showNotification('ID de gimnasio copiado al portapapeles.');
                }}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Copiar ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Gimnasio actual: {activeGymId === 'oXaFQadDDaLQbTO0k9dL' ? 'Principal (Bayron Quezada)' : activeGymId}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={resetDefaultGym}
              className="text-xs text-slate-400 hover:text-white underline font-medium"
            >
              Restablecer al Gimnasio Principal
            </button>

            <button
              type="button"
              onClick={() => switchGym(inputGymId)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-950/40 transition-all active:scale-95"
            >
              Conectar a este Gimnasio
            </button>
          </div>
        </div>
      </div>

      {/* Sección 6: Gestión de Datos y Backups */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4 shadow-xl">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          <span>Copias de Seguridad (Backup Total)</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Descarga un archivo JSON con todos los entrenadores, grupos de trabajo, atletas, registros de 1RM, potencia, sesiones y ejercicios.
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          <button
            onClick={handleExportFullBackup}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-950/40 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Copia de Seguridad JSON</span>
          </button>
        </div>
      </div>

      {/* Modal de Gestión de Coaches */}
      <CoachManagementModal
        isOpen={isManageCoachesOpen}
        onClose={() => setIsManageCoachesOpen(false)}
      />
    </div>
  );
};

export default SettingsView;
