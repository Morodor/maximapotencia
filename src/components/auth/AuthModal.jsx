import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Crown,
  Loader2,
  Sparkles,
  HardDrive,
  Database,
  ShieldAlert
} from 'lucide-react';

export const GoogleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

export const AuthModal = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    loginWithEmail, 
    registerWithEmail, 
    loginWithGoogle, 
    logout,
    currentCoach,
    isHeadCoach,
    showNotification,
    isGuestMode,
    setGuestMode,
    toggleGuestMode,
    migrateGuestDataToCloud
  } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginWithEmail(email, password);
        if (res.success) {
          showNotification(`¡Bienvenido de vuelta, ${res.user?.email || 'Entrenador'}!`);
          onClose();
        } else {
          setErrorMsg(formatAuthError(res.error));
        }
      } else {
        const res = await registerWithEmail(email, password, name);
        if (res.success) {
          showNotification('¡Cuenta creada e iniciada con éxito!');
          onClose();
        } else {
          setErrorMsg(formatAuthError(res.error));
        }
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        showNotification(`¡Sesión iniciada con Google: ${res.user?.email}!`);
        onClose();
      } else {
        setErrorMsg(formatAuthError(res.error));
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    showNotification('Sesión cerrada correctamente.');
    onClose();
  };

  const formatAuthError = (codeOrMsg) => {
    const str = String(codeOrMsg || '');
    if (str.includes('user-not-found') || str.includes('wrong-password') || str.includes('invalid-credential')) {
      return 'Correo o contraseña incorrectos.';
    }
    if (str.includes('email-already-in-use')) {
      return 'Ya existe una cuenta con este correo.';
    }
    if (str.includes('weak-password')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (str.includes('invalid-email')) {
      return 'El formato de correo no es válido.';
    }
    if (str.includes('operation-not-allowed')) {
      return 'El proveedor Correo/Contraseña aún no está activado en tu Firebase Console (ve a Authentication > Sign-in method).';
    }
    return str || 'Ocurrió un error al autenticar.';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Autenticación & Cuenta</h3>
              <p className="text-xs text-slate-400">Acceso oficial a Máxima Potencia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto space-y-5">
          {currentUser ? (
            /* Usuario ya autenticado */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    Sesión Verificada
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5 truncate">{currentUser.email}</h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">UID: {currentUser.uid.slice(0, 12)}...</p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Perfil: <strong>{currentCoach?.name || 'Head Coach'}</strong></span>
                </div>
              </div>

              {/* Botón de Migración de datos locales si existen */}
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
          ) : (
            /* Formulario de Login / Registro */
            <div className="space-y-4">
              {/* Selector de modo Login vs Registro */}
              <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(null); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    mode === 'login'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrorMsg(null); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    mode === 'register'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Crear Cuenta
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'register' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Tu Nombre Completo
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Ej. Bayron Quezada"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 pl-10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="entrenador@gmail.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 pl-10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 pl-10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-red-950/40 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : mode === 'login' ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Iniciar Sesión Ahora</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Crear Cuenta Oficial</span>
                    </>
                  )}
                </button>
              </form>

              {/* Botón Google */}
              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500 font-bold">O también</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-95 group"
              >
                <GoogleIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span>Continuar con Google</span>
              </button>

              {/* Separador e Información de Modo Invitado */}
              <div className="pt-3 border-t border-slate-800 space-y-2.5">
                <div className={`p-4 rounded-2xl border transition-all ${
                  isGuestMode
                    ? 'bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/30'
                    : 'bg-slate-950/80 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <HardDrive className={`w-4 h-4 ${isGuestMode ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-white">Modo Invitado (Almacenamiento Local)</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isGuestMode
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      {isGuestMode ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    {isGuestMode
                      ? '⚠️ Estás operando en Modo Invitado. Todos tus atletas y registros se guardan únicamente en la memoria de este teléfono (localStorage) y jamás se sincronizan en la nube.'
                      : 'Si no deseas iniciar sesión ahora, activa este modo para registrar atletas y sesiones localmente en tu teléfono sin sincronizar con la nube.'}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      toggleGuestMode();
                      if (!isGuestMode) {
                        onClose();
                      }
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 active:scale-95 ${
                      isGuestMode
                        ? 'bg-amber-600/15 border-amber-500/40 text-amber-300 hover:bg-amber-600/25'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                    }`}
                  >
                    <span>
                      {isGuestMode 
                        ? 'Desactivar Modo Invitado (Volver a Solo Lectura)' 
                        : 'Continuar en Modo Invitado (Guardar en LocalStorage)'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
