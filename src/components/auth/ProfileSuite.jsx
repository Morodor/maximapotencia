import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserAvatar,
  AVATAR_PRESETS,
  PROFILE_COLORS,
  PROFILE_SPECIALTIES,
  compressImageToBase64
} from '../common/UserAvatar';
import {
  Camera,
  User,
  Sparkles,
  ShieldCheck,
  Save,
  LogOut,
  Database,
  KeyRound,
  Check,
  Loader2,
  MapPin,
  Award,
  AtSign,
  Building2,
  Crown,
  Upload,
  RotateCcw
} from 'lucide-react';
import { DEFAULT_GYM_ID } from '../../config/firebase';

export const ProfileSuite = ({ onClose }) => {
  const {
    currentUser,
    currentUserProfile,
    currentCoach,
    isSuperAdmin,
    activeGymId,
    registeredGyms = [],
    updateUserProfile,
    migrateGuestDataToCloud,
    logout,
    showNotification
  } = useApp();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'avatar' | 'account'
  const fileInputRef = useRef(null);

  // Campos de identidad
  const [displayName, setDisplayName] = useState('');
  const [nickname, setNickname] = useState('');
  const [title, setTitle] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [certification, setCertification] = useState('');
  const [location, setLocation] = useState('');
  const [instagram, setInstagram] = useState('');
  const [bio, setBio] = useState('');
  const [pin, setPin] = useState('');

  // Campos de avatar y estilo
  const [avatarType, setAvatarType] = useState('initials');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreset, setAvatarPreset] = useState('weightlifter');
  const [color, setColor] = useState('#3b82f6');

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    const src = currentUserProfile || {};
    const coachSrc = currentCoach || {};
    const defaultName = src.displayName || coachSrc.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
    const googlePic = src.googlePhotoURL || currentUser?.photoURL || '';
    const savedUrl = src.avatarUrl || coachSrc.avatarUrl || src.photoURL || googlePic || '';

    setDisplayName(defaultName);
    setNickname(src.nickname || coachSrc.nickname || '');
    setTitle(src.title || coachSrc.title || '');
    setSpecialty(src.specialty || coachSrc.specialty || '');
    setCertification(src.certification || coachSrc.certification || '');
    setLocation(src.location || '');
    setInstagram(src.instagram || '');
    setBio(src.bio || coachSrc.bio || '');
    setPin(coachSrc.pin || src.pin || '');
    setColor(src.color || coachSrc.color || (isSuperAdmin ? '#ef4444' : '#3b82f6'));

    const resolvedType = src.avatarType || coachSrc.avatarType || (savedUrl ? 'photo' : 'initials');
    setAvatarType(resolvedType);
    setAvatarUrl(savedUrl);
    setAvatarPreset(src.avatarPreset || coachSrc.avatarPreset || 'weightlifter');
  }, [currentUserProfile, currentCoach, currentUser, isSuperAdmin]);

  if (!currentUser) return null;

  const googlePhotoAvailable = currentUserProfile?.googlePhotoURL || currentUser?.photoURL || '';
  const activeGymName =
    registeredGyms.find(g => g.id === activeGymId)?.name ||
    (activeGymId === DEFAULT_GYM_ID ? 'Gimnasio Principal (Máxima Potencia)' : activeGymId);

  const previewProfile = {
    displayName,
    nickname,
    avatarType,
    avatarUrl,
    avatarPreset,
    photoURL: googlePhotoAvailable,
    color
  };

  const roleLabel = isSuperAdmin
    ? 'Super Administrador General'
    : currentCoach?.role === 'head_coach'
      ? 'Head Coach'
      : currentCoach?.role === 'coach'
        ? 'Entrenador de Cuadrilla'
        : currentCoach?.role === 'assistant'
          ? 'Asistente Técnico'
          : 'Sin rol asignado (Pendiente)';

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const compressed = await compressImageToBase64(file, 220, 0.8);
      setAvatarUrl(compressed);
      setAvatarType('photo');
      showNotification('Imagen cargada en vista previa. Pulsa "Guardar" para aplicarla.');
    } catch (err) {
      showNotification(err?.message || 'Error al cargar la imagen.', true);
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    await updateUserProfile({
      displayName: displayName.trim() || currentUser.email?.split('@')[0] || 'Usuario',
      nickname: nickname.trim().replace(/^@+/, ''),
      title: title.trim(),
      specialty: specialty.trim(),
      certification: certification.trim(),
      location: location.trim(),
      instagram: instagram.trim().replace(/^@+/, ''),
      bio: bio.trim(),
      pin: pin.trim(),
      avatarType,
      avatarUrl,
      avatarPreset,
      photoURL: avatarType === 'photo' ? avatarUrl : (googlePhotoAvailable || ''),
      color
    });
    setSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    showNotification('Sesión cerrada correctamente.');
    onClose();
  };

  return (
    <div className="space-y-4">
      {/* Hero Banner de Identidad en Vivo */}
      <div
        className="relative overflow-hidden rounded-2xl border border-slate-800 p-4 sm:p-5 bg-slate-950 shadow-lg"
        style={{
          backgroundImage: `linear-gradient(135deg, ${color}24 0%, rgba(2, 6, 23, 0.96) 65%)`
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative w-fit mx-auto sm:mx-0">
            <UserAvatar
              profile={previewProfile}
              name={displayName}
              email={currentUser.email}
              color={color}
              size="xl"
              showCrown={isSuperAdmin || currentCoach?.role === 'head_coach'}
            />
            <button
              type="button"
              onClick={() => setActiveTab('avatar')}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center shadow-md transition-transform active:scale-95"
              title="Cambiar avatar o foto"
            >
              <Camera className="w-4 h-4 text-red-400" />
            </button>
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h4 className="text-base sm:text-lg font-black text-white truncate">
                {displayName || currentUser.email?.split('@')[0]}
              </h4>
              {nickname.trim() && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-amber-300 font-mono">
                  @{nickname.trim().replace(/^@+/, '')}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 truncate">
              {title.trim() || roleLabel}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                isSuperAdmin
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : currentCoach?.role === 'head_coach'
                    ? 'bg-red-500/15 text-red-300 border-red-500/30'
                    : currentCoach?.role === 'coach'
                      ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      : currentCoach?.role === 'assistant'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                <Crown className="w-3 h-3" />
                <span>{roleLabel}</span>
              </span>

              {specialty.trim() && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300">
                  {specialty}
                </span>
              )}
              {certification.trim() && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 inline-flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>{certification}</span>
                </span>
              )}
            </div>

            {bio.trim() && (
              <p className="text-[11px] text-slate-400 italic pt-1 line-clamp-2">
                “{bio.trim()}”
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pestañas de la Suite de Perfil */}
      <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'profile'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Perfil</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('avatar')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'avatar'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Avatar & Estilo</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'account'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Cuenta</span>
        </button>
      </div>

      {/* TAB 1: PERFIL & IDENTIDAD */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-3 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Tu nombre visible"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                <AtSign className="w-3 h-3 text-amber-400" />
                <span>Apodo / Alias</span>
              </label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="Ej. CoachBayron, TitanVBT"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Cargo / Título Deportivo
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej. Preparador Físico VBT"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Especialidad Principal
              </label>
              <select
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">-- Seleccionar especialidad --</option>
                {PROFILE_SPECIALTIES.map(sp => (
                  <option key={sp} value={sp}>{sp}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                <Award className="w-3 h-3 text-emerald-400" />
                <span>Certificación / Credencial</span>
              </label>
              <input
                type="text"
                value={certification}
                onChange={e => setCertification(e.target.value)}
                placeholder="Ej. NSCA-CSCS, IWF L1, Kinesiólogo"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-cyan-400" />
                <span>Ciudad / Club</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Ej. Santiago, Chile"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Instagram (Opcional)
            </label>
            <input
              type="text"
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              placeholder="@usuario_entrenamiento"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Biografía / Lema Deportivo
            </label>
            <textarea
              rows={2}
              maxLength={180}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Ej. Entrenamiento basado en velocidad, técnica olímpica y fuerza máxima."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Guardar Identidad y Perfil</span>
          </button>
        </form>
      )}

      {/* TAB 2: AVATAR & ESTILO */}
      {activeTab === 'avatar' && (
        <div className="space-y-4 animate-in fade-in">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {/* Acciones de Foto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>Subir Foto desde Dispositivo</span>
            </button>

            <div className="flex gap-2">
              {googlePhotoAvailable && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarUrl(googlePhotoAvailable);
                    setAvatarType('photo');
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    avatarType === 'photo' && avatarUrl === googlePhotoAvailable
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Foto Google</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setAvatarType('initials')}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  avatarType === 'initials'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
              >
                Iniciales
              </button>
            </div>
          </div>

          {/* Avatares Deportivos Predefinidos */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-2">
              Avatares Deportivos Pro
            </label>
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_PRESETS.map(p => {
                const selected = avatarType === 'preset' && avatarPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setAvatarType('preset');
                      setAvatarPreset(p.id);
                    }}
                    className={`p-2 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                      selected
                        ? 'border-white ring-2 ring-red-500 shadow-lg scale-105 bg-slate-800'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-600'
                    }`}
                    title={p.label}
                  >
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow"
                      style={{ background: p.gradient }}
                    >
                      {p.emoji}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 truncate w-full text-center">
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Personalizado de Perfil */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-2">
              Color Distintivo de Perfil
            </label>
            <div className="flex flex-wrap gap-2.5">
              {PROFILE_COLORS.map(hex => {
                const active = color === hex;
                return (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setColor(hex)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform ${
                      active ? 'border-white scale-110 shadow-lg' : 'border-slate-700 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: hex }}
                  >
                    {active && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Guardar Avatar y Estilo</span>
          </button>
        </div>
      )}

      {/* TAB 3: CUENTA & SEGURIDAD */}
      {activeTab === 'account' && (
        <div className="space-y-3.5 animate-in fade-in">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Correo Verificado:</span>
              <span className="font-mono font-bold text-white truncate">{currentUser.email}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Rol Actual:</span>
              <span className="font-bold text-amber-300">{roleLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Gimnasio Activo:</span>
              </span>
              <span className="font-semibold text-slate-200 truncate">{activeGymName}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">UID Firebase:</span>
              <span className="font-mono text-slate-500">{currentUser.uid.slice(0, 14)}...</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <label className="block text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>PIN Rápido de Entrenador (4 dígitos)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Opcional (ej. 1234)"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all active:scale-95 shrink-0"
              >
                {saving ? '...' : 'Guardar PIN'}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              const ok = await migrateGuestDataToCloud();
              if (ok) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95"
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Migrar datos locales de invitado a mi cuenta</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-bold transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </div>
  );
};
