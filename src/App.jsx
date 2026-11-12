import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { Notification } from './components/layout/Notification';
import { FloatingTimer } from './components/common/FloatingTimer';
import { UpdateBanner } from './components/system/UpdateBanner';
import { UpdateModal } from './components/system/UpdateModal';
import { Loader2 } from 'lucide-react';

// Carga perezosa (Code Splitting) para rendimiento móvil óptimo
const DashboardView = lazy(() => import('./components/dashboard/DashboardView').then(m => ({ default: m.DashboardView })));
const AthletesView = lazy(() => import('./components/athletes/AthletesView').then(m => ({ default: m.AthletesView })));
const ExercisesView = lazy(() => import('./components/exercises/ExercisesView').then(m => ({ default: m.ExercisesView })));
const RMView = lazy(() => import('./components/rm/RMView').then(m => ({ default: m.RMView })));
const PowerView = lazy(() => import('./components/power/PowerView').then(m => ({ default: m.PowerView })));
const SessionsView = lazy(() => import('./components/sessions/SessionsView').then(m => ({ default: m.SessionsView })));
const AnalysisView = lazy(() => import('./components/analysis/AnalysisView').then(m => ({ default: m.AnalysisView })));
const HistoryView = lazy(() => import('./components/history/HistoryView').then(m => ({ default: m.HistoryView })));
const UtilitiesView = lazy(() => import('./components/utilities/UtilitiesView').then(m => ({ default: m.UtilitiesView })));
const AchievementsView = lazy(() => import('./components/achievements/AchievementsView').then(m => ({ default: m.AchievementsView })));
const GuideView = lazy(() => import('./components/guide/GuideView').then(m => ({ default: m.GuideView })));
const SettingsView = lazy(() => import('./components/settings/SettingsView').then(m => ({ default: m.SettingsView })));

const ModuleFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-in fade-in">
    <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center mb-3">
      <Loader2 className="w-6 h-6 animate-spin text-red-500" />
    </div>
    <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Cargando Módulo...</span>
  </div>
);

const MainContent = () => {
  const { currentPanel, loading, isUpdateModalOpen, setIsUpdateModalOpen, currentAppVersion } = useApp();

  const renderPanel = () => {
    switch (currentPanel) {
      case 'dashboard':
        return <DashboardView />;
      case 'athletes':
        return <AthletesView />;
      case 'exercises':
        return <ExercisesView />;
      case '1rm':
        return <RMView />;
      case 'power':
        return <PowerView />;
      case 'sessions':
        return <SessionsView />;
      case 'analysis':
        return <AnalysisView />;
      case 'history':
        return <HistoryView />;
      case 'utilities':
        return <UtilitiesView />;
      case 'achievements':
        return <AchievementsView />;
      case 'guide':
        return <GuideView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-full max-w-full overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Barra Lateral Desktop */}
      <Sidebar />

      {/* Área Principal de Contenido */}
      <main 
        className="flex-1 min-w-0 w-full max-w-full flex flex-col px-3 sm:px-4 lg:px-10 overflow-y-auto overflow-x-hidden custom-scrollbar pb-28 lg:pb-10 pt-7 sm:pt-6 lg:pt-8"
        style={{ paddingTop: 'max(1.75rem, calc(env(safe-area-inset-top, 0px) + 0.75rem))' }}
      >
        {/* Banner de Actualización Disponible */}
        <UpdateBanner />

        <Header />
        
        <div className="flex-1 min-w-0 w-full max-w-full">
          <Suspense fallback={<ModuleFallback />}>
            {renderPanel()}
          </Suspense>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-900 text-center text-xs text-slate-600">
          <p>Máxima Potencia v{currentAppVersion || '2.1.0'} • Plataforma de Rendimiento Deportivo y Fuerza</p>
        </footer>
      </main>

      {/* Navegación Móvil */}
      <MobileNav />

      {/* Floating Rest Timer */}
      <FloatingTimer />

      {/* Notificación Toast */}
      <Notification />

      {/* Modal de Actualización Disponible */}
      <UpdateModal 
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
