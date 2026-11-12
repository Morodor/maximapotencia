import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { navItems } from './Sidebar';
import { hapticTap } from '../../utils/feedback';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  CalendarPlus, 
  Menu, 
  X,
  LayoutGrid,
  User,
  ChevronRight
} from 'lucide-react';

export const MobileNav = () => {
  const { currentPanel, setCurrentPanel, currentUser, setIsAuthModalOpen } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const mainButtons = [
    { id: 'dashboard', name: 'Inicio', icon: LayoutDashboard },
    { id: 'athletes', name: 'Atletas', icon: Users },
    { id: '1rm', name: '1RM', icon: TrendingUp },
    { id: 'sessions', name: 'Sesiones', icon: CalendarPlus }
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Backdrop oscuro con blur */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
        />
      )}

      {/* Expanded Menu Drawer (Bottom Sheet Completo) */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-900/98 backdrop-blur-md border-t border-slate-800 p-4 pb-20 sm:pb-16 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-250 max-h-[88vh] flex flex-col">
          {/* Barra de arrastre táctil */}
          <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-2 shrink-0" />

          {/* Cabecera del Cajón */}
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-800/80 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider block">
                  Módulos de Máxima Potencia
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Perfil de Usuario y Módulos
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tarjeta Destacada de Perfil / Cuenta de Usuario */}
          <div 
            onClick={() => {
              hapticTap();
              setIsAuthModalOpen(true);
              setIsOpen(false);
            }}
            className="mb-3 p-3 bg-gradient-to-r from-slate-800/90 via-slate-800/70 to-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-2xl flex items-center justify-between cursor-pointer active:scale-98 transition-all shrink-0 shadow-md group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                currentUser 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                  : 'bg-red-600/20 border-red-500/40 text-red-400'
              }`}>
                {currentUser?.email ? currentUser.email[0].toUpperCase() : <User className="w-5 h-5" />}
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  {currentUser && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>}
                  <p className="text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors">
                    {currentUser 
                      ? (currentUser.displayName || currentUser.email?.split('@')[0] || 'Mi Perfil')
                      : 'Cuenta & Sesión'}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {currentUser ? currentUser.email : 'Toca para iniciar sesión o registrarte'}
                </p>
              </div>
            </div>
            
            <div className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 flex items-center gap-1 border ${
              currentUser 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-600 text-white border-red-500 shadow-sm'
            }`}>
              {currentUser ? <span>Mi Cuenta</span> : <span>Ingresar</span>}
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Rejilla de Módulos (Amplia, visible al 100% sin cortes) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-0.5 py-1">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {/* Posición 1: Botón Directo Mi Cuenta / Perfil de Usuario */}
              <button
                onClick={() => {
                  hapticTap();
                  setIsAuthModalOpen(true);
                  setIsOpen(false);
                }}
                className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl transition-all active:scale-95 text-center bg-gradient-to-b from-slate-800 to-slate-800/80 hover:bg-slate-800 text-slate-200 border border-red-500/40 shadow-xs relative overflow-hidden group"
              >
                {currentUser && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-500/20"></span>
                )}
                <div className="w-7 h-7 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-1 shrink-0 group-hover:scale-110 transition-transform">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold tracking-tight truncate w-full block text-white">
                  Mi Cuenta
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5 truncate w-full block">
                  {currentUser ? 'Perfil' : 'Ingresar'}
                </span>
              </button>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPanel === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      hapticTap();
                      setCurrentPanel(item.id);
                      setIsOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl transition-all active:scale-95 text-center ${
                      isActive
                        ? 'bg-red-600 text-white font-extrabold shadow-lg shadow-red-950/60 ring-2 ring-red-400/40'
                        : 'bg-slate-800/85 hover:bg-slate-800 text-slate-200 border border-slate-700/60 shadow-xs'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-1.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold tracking-tight truncate w-full block">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Bar Inferior Fija */}
      <nav 
        className="relative z-50 grid grid-cols-5 gap-1 p-1 bg-slate-900 border-t border-slate-800 shadow-xl"
        style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))' }}
      >
        {mainButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = currentPanel === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => {
                hapticTap();
                setCurrentPanel(btn.id);
                setIsOpen(false);
              }}
              className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-red-500 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="mt-0.5">{btn.name}</span>
            </button>
          );
        })}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            isOpen ? 'text-red-500 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span className="mt-0.5">Más</span>
        </button>
      </nav>
    </div>
  );
};
