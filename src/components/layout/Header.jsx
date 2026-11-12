import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { navItems } from './Sidebar';
import { ShieldCheck, Wifi, Activity, Crown, ChevronDown, Users, Rocket, User, LogIn } from 'lucide-react';
import { CoachSwitcherModal } from '../coaches/CoachSwitcherModal';
import { CoachManagementModal } from '../coaches/CoachManagementModal';
import { AuthModal } from '../auth/AuthModal';

export const Header = () => {
  const { 
    currentPanel, 
    athletes, 
    currentCoach, 
    isHeadCoach, 
    coaches,
    hasUpdateAvailable,
    appUpdateInfo,
    setIsUpdateModalOpen,
    currentUser,
    isAuthModalOpen,
    setIsAuthModalOpen
  } = useApp();
  const currentItem = navItems.find(i => i.id === currentPanel) || navItems[0];

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);

  // Iniciales del coach
  const coachInitials = currentCoach?.name
    ? currentCoach.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'HC';

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentItem.name}
            </h2>
            {/* Live Sync Status Pill */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>En Línea</span>
            </span>
          </div>
          <p className="text-slate-400 mt-1 text-sm font-medium">
            {currentItem.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Píldora de Actualización Disponible */}
          {hasUpdateAvailable && (
            <button
              onClick={() => setIsUpdateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-black shadow-md shadow-red-950/40 animate-pulse active:scale-95 transition-all"
              title="Nueva versión oficial disponible"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>v{appUpdateInfo?.latestVersion} Disponible</span>
            </button>
          )}

          {/* Tarjeta Interactiva del Entrenador Activo */}
          <button
            onClick={() => setIsSwitcherOpen(true)}
            className="flex items-center gap-3 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-2xl shadow-sm backdrop-blur transition-all active:scale-95 group text-left"
            title="Cambiar de entrenador o gestionar equipo"
          >
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs border border-white/10 shadow-md relative shrink-0"
              style={{ backgroundColor: currentCoach?.color || '#ef4444' }}
            >
              {coachInitials}
              {isHeadCoach && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center shadow">
                  <Crown className="w-2.5 h-2.5 fill-current" />
                </span>
              )}
            </div>

            <div className="text-left text-xs pr-1">
              <p className="font-bold text-white flex items-center gap-1.5 leading-tight group-hover:text-red-400 transition-colors">
                <span>{currentCoach?.name || 'Entrenador'}</span>
                {isHeadCoach ? (
                  <Crown className="w-3 h-3 text-amber-400 inline" />
                ) : (
                  <ShieldCheck className="w-3 h-3 text-blue-400 inline" />
                )}
              </p>
              <p className="text-slate-500 text-[11px] font-medium mt-0.5">
                {currentCoach?.title || (isHeadCoach ? 'Head Coach' : 'Coach de Cuadrilla')}
              </p>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors ml-1" />
          </button>

          {/* Botón de Autenticación / Cuenta Firebase */}
          {currentUser ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-2xl shadow-sm backdrop-blur transition-all active:scale-95 group text-left"
              title="Cuenta de usuario conectada"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden sm:block text-left text-xs pr-1">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span className="font-bold text-white group-hover:text-emerald-400 transition-colors truncate max-w-[110px]">
                    {currentUser.displayName || currentUser.email?.split('@')[0] || 'Conectado'}
                  </span>
                </div>
                <p className="text-slate-500 text-[10px] font-medium truncate max-w-[110px] mt-0.5">
                  {currentUser.email}
                </p>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold px-3.5 py-2.5 rounded-2xl shadow-md shadow-red-950/40 text-xs transition-all active:scale-95"
              title="Iniciar sesión en Máxima Potencia"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>
          )}
        </div>
      </header>

      {/* Modal Autenticación Firebase */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Modal Cambio Rápido de Coach */}
      <CoachSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        onOpenManageCoaches={() => setIsManageOpen(true)}
      />

      {/* Modal Administración de Equipo de Coaches (Solo Head Coach) */}
      <CoachManagementModal
        isOpen={isManageOpen}
        onClose={() => setIsManageOpen(false)}
      />
    </>
  );
};
