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
  X 
} from 'lucide-react';

export const MobileNav = () => {
  const { currentPanel, setCurrentPanel } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const mainButtons = [
    { id: 'dashboard', name: 'Inicio', icon: LayoutDashboard },
    { id: 'athletes', name: 'Atletas', icon: Users },
    { id: '1rm', name: '1RM', icon: TrendingUp },
    { id: 'sessions', name: 'Sesiones', icon: CalendarPlus }
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Expanded Menu Drawer */}
      {isOpen && (
        <div className="fixed bottom-14 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 p-4 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Módulos</span>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
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
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-red-600 text-white font-semibold'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="truncate w-full text-center">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Bar */}
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
