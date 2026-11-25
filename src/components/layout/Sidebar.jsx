import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  Dumbbell, 
  TrendingUp, 
  Zap, 
  CalendarPlus, 
  BarChart2, 
  History, 
  Wrench, 
  Trophy, 
  Youtube, 
  HelpCircle, 
  Settings,
  User,
  Crown 
} from 'lucide-react';

export const navItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, subtitle: 'Resumen del rendimiento de tu equipo.' },
  { id: 'athletes', name: 'Atletas', icon: Users, subtitle: 'Gestiona y sigue el progreso de tus atletas.' },
  { id: 'exercises', name: 'Ejercicios', icon: Dumbbell, subtitle: 'Gestiona tu biblioteca de ejercicios.' },
  { id: '1rm', name: '1RM', icon: TrendingUp, subtitle: 'Calcula y registra tus récords de 1RM.' },
  { id: 'power', name: 'Potencia', icon: Zap, subtitle: 'Monitoriza las métricas de potencia y velocidad.' },
  { id: 'sessions', name: 'Sesiones', icon: CalendarPlus, subtitle: 'Registra y planifica sesiones de entrenamiento.' },
  { id: 'analysis', name: 'Análisis', icon: BarChart2, subtitle: 'Visualiza perfiles de rendimiento y VBT.' },
  { id: 'history', name: 'Historial', icon: History, subtitle: 'Explora el historial completo de datos.' },
  { id: 'utilities', name: 'Utilidades', icon: Wrench, subtitle: 'Herramientas y calculadoras de gimnasio.' },
  { id: 'achievements', name: 'Logros', icon: Trophy, subtitle: 'Visualiza hitos y récords alcanzados.' },
  { id: 'guide', name: 'Guía', icon: HelpCircle, subtitle: 'Cómo usar esta aplicación.' },
  { id: 'settings', name: 'Ajustes', icon: Settings, subtitle: 'Configuración y copias de seguridad.' }
];

export const Sidebar = () => {
  const { currentPanel, setCurrentPanel, currentUser, setIsAuthModalOpen, isGuestMode, currentAppVersion, isSuperAdmin } = useApp();

  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-800 flex-shrink-0 hidden lg:flex flex-col p-2.5">
      <div className="flex-1 flex flex-col w-full bg-slate-800/80 backdrop-blur rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
        {/* Brand Compacto */}
        <div className="px-3 py-2.5 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-md shadow-red-900/40 font-black text-white text-sm tracking-wider shrink-0">
              MP
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-white tracking-tight leading-tight truncate">Máxima Potencia</h1>
              <span className="text-[10px] font-mono text-red-400 font-semibold block leading-tight">v{currentAppVersion || '2.5.0'} Pro</span>
            </div>
          </div>
        </div>

        {/* Acceso Rápido a Cuenta / Perfil */}
        <div className="px-2 py-1.5 border-b border-slate-700/50 shrink-0">
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full flex items-center justify-between p-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 hover:border-slate-600 transition-all text-left group"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                isSuperAdmin
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 ring-1 ring-amber-500/30'
                  : currentUser 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : isGuestMode
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-red-600/20 text-red-400 border border-red-500/30'
              }`}>
                {isSuperAdmin ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : currentUser?.email ? currentUser.email[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors">
                    {currentUser 
                      ? (currentUser.displayName || currentUser.email?.split('@')[0]) 
                      : isGuestMode
                      ? 'Modo Invitado'
                      : 'Iniciar Sesión'}
                  </span>
                  {isSuperAdmin && (
                    <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded font-black tracking-wide shrink-0">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate leading-tight">
                  {isSuperAdmin ? 'Super Admin • Control Total' : currentUser ? currentUser.email : isGuestMode ? 'Solo LocalStorage' : 'Cuenta & Acceso'}
                </p>
              </div>
            </div>
            {currentUser && (
              <span className={`w-2 h-2 rounded-full shrink-0 ml-1 ${isSuperAdmin ? 'bg-amber-400' : 'bg-emerald-500'}`}></span>
            )}
            {isGuestMode && !currentUser && (
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 ml-1"></span>
            )}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
          {isSuperAdmin && (
            <button
              onClick={() => setCurrentPanel('admin')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl font-bold text-xs transition-all duration-150 mb-1 border ${
                currentPanel === 'admin'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-950/40'
                  : 'bg-amber-950/20 text-amber-300 border-amber-500/30 hover:bg-amber-950/40 hover:border-amber-500/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Crown className={`w-3.5 h-3.5 ${currentPanel === 'admin' ? 'text-slate-950 fill-slate-950' : 'text-amber-400'}`} />
                <span>Super Admin</span>
              </div>
              <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-black tracking-wider ${
                currentPanel === 'admin' ? 'bg-slate-950 text-amber-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                Panel
              </span>
            </button>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPanel === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPanel(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium text-[13px] transition-all duration-150 ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-900/30 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Link to YouTube */}
        <div className="p-1.5 border-t border-slate-700/50 shrink-0">
          <a
            href="https://www.youtube.com/@M%C3%A1ximaPotencia3000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-700/40 transition-colors"
          >
            <Youtube className="w-4 h-4 text-red-500 shrink-0" />
            <span>Canal de YouTube</span>
          </a>
        </div>
      </div>
    </aside>
  );
};
