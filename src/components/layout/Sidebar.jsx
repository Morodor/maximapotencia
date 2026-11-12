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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 hidden lg:flex flex-col p-4">
      <div className="flex-1 flex flex-col w-full bg-slate-800/80 backdrop-blur rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
        {/* Brand */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/40 font-bold text-white text-lg tracking-wider">
              MP
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Máxima Potencia</h1>
              <span className="text-xs font-mono text-red-400 font-semibold">v{currentAppVersion || '2.1.0'} Pro</span>
            </div>
          </div>
        </div>

        {/* Acceso Rápido a Cuenta / Perfil */}
        <div className="p-2 border-b border-slate-700/50">
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 hover:border-slate-600 transition-all text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                isSuperAdmin
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 ring-1 ring-amber-500/30'
                  : currentUser 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : isGuestMode
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-red-600/20 text-red-400 border border-red-500/30'
              }`}>
                {isSuperAdmin ? <Crown className="w-4 h-4 text-amber-400" /> : currentUser?.email ? currentUser.email[0].toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors flex items-center gap-1">
                  <span>{currentUser 
                    ? (currentUser.displayName || currentUser.email?.split('@')[0]) 
                    : isGuestMode
                    ? 'Modo Invitado'
                    : 'Iniciar Sesión'}</span>
                  {isSuperAdmin && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-black tracking-wide">
                      ADMIN
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {isSuperAdmin ? 'Super Admin • Control Total' : currentUser ? currentUser.email : isGuestMode ? 'Solo LocalStorage' : 'Cuenta & Acceso'}
                </p>
              </div>
            </div>
            {currentUser && (
              <span className={`w-2 h-2 rounded-full shrink-0 ${isSuperAdmin ? 'bg-amber-400' : 'bg-emerald-500'}`}></span>
            )}
            {isGuestMode && !currentUser && (
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
            )}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPanel === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPanel(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-900/30 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Link to YouTube */}
        <div className="p-3 border-t border-slate-700/50">
          <a
            href="https://www.youtube.com/@M%C3%A1ximaPotencia3000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-700/40 transition-colors"
          >
            <Youtube className="w-4 h-4 text-red-500" />
            <span>Canal de YouTube</span>
          </a>
        </div>
      </div>
    </aside>
  );
};
