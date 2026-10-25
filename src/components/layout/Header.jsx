import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { navItems } from './Sidebar';
import { ShieldCheck, Wifi, Activity, Crown, ChevronDown, Users } from 'lucide-react';
import { CoachSwitcherModal } from '../coaches/CoachSwitcherModal';
import { CoachManagementModal } from '../coaches/CoachManagementModal';

export const Header = () => {
  const { currentPanel, athletes, currentCoach, isHeadCoach, coaches } = useApp();
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

        <div className="flex items-center gap-3">
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
        </div>
      </header>

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
