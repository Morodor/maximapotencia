import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, Download, Upload, Shield, Save, Database, Crown, Users, KeyRound, ShieldCheck } from 'lucide-react';
import { CoachManagementModal } from '../coaches/CoachManagementModal';

export const SettingsView = () => {
  const { 
    athletes, 
    groups,
    rmRecords, 
    powerRecords, 
    sessions, 
    exercises, 
    coaches,
    currentCoach,
    isHeadCoach,
    updateCoach,
    showNotification 
  } = useApp();

  const [coachName, setCoachName] = useState('');
  const [coachTitle, setCoachTitle] = useState('');
  const [coachPin, setCoachPin] = useState('');
  const [isManageCoachesOpen, setIsManageCoachesOpen] = useState(false);

  useEffect(() => {
    if (currentCoach) {
      setCoachName(currentCoach.name || '');
      setCoachTitle(currentCoach.title || '');
      setCoachPin(currentCoach.pin || '');
    }
  }, [currentCoach]);

  const handleSaveCurrentCoach = async () => {
    if (!currentCoach?.id) return;
    await updateCoach(currentCoach.id, {
      name: coachName,
      title: coachTitle,
      pin: coachPin
    });
  };

  // Exportar backup completo
  const handleExportFullBackup = () => {
    const fullBackup = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      coaches,
      groups,
      athletes,
      rmRecords,
      powerRecords,
      sessions,
      exercises
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `maxima_potencia_backup_total_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Copia de seguridad descargada.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Sección 1: Equipo de Entrenadores y Jerarquía (RBAC) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Jerarquía & Equipo de Entrenadores</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Administra los rangos entre Head Coach y entrenadores encargados de cada cuadrilla.
            </p>
          </div>

          {isHeadCoach && (
            <button
              onClick={() => setIsManageCoachesOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-950/40 transition-all active:scale-95 shrink-0"
            >
              <Users className="w-4 h-4" />
              <span>Gestionar Coaches ({coaches.length})</span>
            </button>
          )}
        </div>

        {/* Resumen del equipo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Tu Rol Actual</span>
            <p className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
              {isHeadCoach ? (
                <>
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Head Coach (Super Admin)</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Coach de Cuadrilla</span>
                </>
              )}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {isHeadCoach ? 'Control de todo el gimnasio' : `${currentCoach?.assignedGroupIds?.length || 0} cuadrillas asignadas`}
            </p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Entrenadores Registrados</span>
            <p className="text-2xl font-black text-white mt-1 font-mono">{coaches.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {coaches.filter(c => c.role === 'head_coach').length} Head Coach • {coaches.filter(c => c.role === 'coach').length} de Grupo
            </p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Grupos / Cuadrillas</span>
            <p className="text-2xl font-black text-white mt-1 font-mono">{groups.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {athletes.length} Atletas asignables
            </p>
          </div>
        </div>
      </div>

      {/* Sección 2: Mi Perfil de Entrenador Activo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4 shadow-xl">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" />
          <span>Mi Perfil ({currentCoach?.name})</span>
        </h3>
        <p className="text-xs text-slate-400">
          Ajusta tu nombre, cargo visible en la cabecera y PIN numérico de acceso rápido.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Nombre
            </label>
            <input
              type="text"
              value={coachName}
              onChange={e => setCoachName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Descripción / Cargo
            </label>
            <input
              type="text"
              value={coachTitle}
              onChange={e => setCoachTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>PIN de Acceso (4 dígitos)</span>
            </label>
            <input
              type="password"
              maxLength={4}
              value={coachPin}
              onChange={e => setCoachPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Sin PIN (acceso libre)"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <button
          onClick={handleSaveCurrentCoach}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors mt-2"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Mi Perfil</span>
        </button>
      </div>

      {/* Sección 3: Gestión de Datos y Backups */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4 shadow-xl">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          <span>Copias de Seguridad (Backup Total)</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Descarga un archivo JSON con todos los entrenadores, grupos de trabajo, atletas, registros de 1RM, potencia, sesiones y ejercicios.
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          <button
            onClick={handleExportFullBackup}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-950/40 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Copia de Seguridad JSON</span>
          </button>
        </div>
      </div>

      {/* Modal de Gestión de Coaches */}
      <CoachManagementModal
        isOpen={isManageCoachesOpen}
        onClose={() => setIsManageCoachesOpen(false)}
      />
    </div>
  );
};

export default SettingsView;
