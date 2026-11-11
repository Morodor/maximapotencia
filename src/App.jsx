import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { Notification } from './components/layout/Notification';
import { FloatingTimer } from './components/common/FloatingTimer';
import { UpdateBanner } from './components/system/UpdateBanner';
import { UpdateModal } from './components/system/UpdateModal';

import { DashboardView } from './components/dashboard/DashboardView';
import { AthletesView } from './components/athletes/AthletesView';
import { ExercisesView } from './components/exercises/ExercisesView';
import { RMView } from './components/rm/RMView';
import { PowerView } from './components/power/PowerView';
import { SessionsView } from './components/sessions/SessionsView';
import { AnalysisView } from './components/analysis/AnalysisView';
import { HistoryView } from './components/history/HistoryView';
import { UtilitiesView } from './components/utilities/UtilitiesView';
import { AchievementsView } from './components/achievements/AchievementsView';
import { GuideView } from './components/guide/GuideView';
import { SettingsView } from './components/settings/SettingsView';

const MainContent = () => {
  const { currentPanel, loading, isUpdateModalOpen, setIsUpdateModalOpen } = useApp();

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
          {renderPanel()}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-900 text-center text-xs text-slate-600">
          <p>Máxima Potencia v2.0 • Plataforma de Rendimiento Deportivo y Fuerza</p>
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
