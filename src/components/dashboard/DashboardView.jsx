import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CalendarPlus, 
  TrendingUp, 
  Zap, 
  Users, 
  ClipboardList, 
  Award, 
  Flame, 
  ArrowRight,
  Activity,
  Layers
} from 'lucide-react';
import { VolumeBarChart } from '../charts/VolumeBarChart';

export const DashboardView = () => {
  const { 
    setCurrentPanel, 
    athletes, 
    groups,
    getAthleteGroups,
    rmRecords, 
    powerRecords, 
    sessions 
  } = useApp();

  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');

  // Filtrado de atletas por grupo
  const filteredAthletes = useMemo(() => {
    if (selectedGroupFilter === 'all') return athletes;
    return athletes.filter(a => {
      const gList = getAthleteGroups(a);
      return gList.some(g => g.id === selectedGroupFilter);
    });
  }, [athletes, selectedGroupFilter, getAthleteGroups]);

  const filteredAthleteIds = useMemo(() => new Set(filteredAthletes.map(a => a.id)), [filteredAthletes]);

  const filteredRMRecords = useMemo(() => {
    if (selectedGroupFilter === 'all') return rmRecords;
    return rmRecords.filter(r => filteredAthleteIds.has(r.userId));
  }, [rmRecords, selectedGroupFilter, filteredAthleteIds]);

  const filteredPowerRecords = useMemo(() => {
    if (selectedGroupFilter === 'all') return powerRecords;
    return powerRecords.filter(p => filteredAthleteIds.has(p.userId));
  }, [powerRecords, selectedGroupFilter, filteredAthleteIds]);

  const filteredSessions = useMemo(() => {
    if (selectedGroupFilter === 'all') return sessions;
    return sessions.filter(s => s.attendees?.some(id => filteredAthleteIds.has(id)));
  }, [sessions, selectedGroupFilter, filteredAthleteIds]);

  // Actividad combinada reciente ordenada por fecha
  const recentRecords = useMemo(() => {
    return [
      ...filteredRMRecords.map(r => ({
        id: r.id,
        type: '1RM',
        name: r.exercise,
        value: `${r.weight} kg`,
        userId: r.userId,
        date: r.date?.toDate ? r.date.toDate() : new Date(r.date || Date.now())
      })),
      ...filteredPowerRecords.map(p => ({
        id: p.id,
        type: 'Potencia',
        name: p.exercise,
        value: p.distance ? `${p.distance} cm` : p.velocity ? `${p.velocity} m/s` : `${p.load} kg`,
        userId: p.userId,
        date: p.date?.toDate ? p.date.toDate() : new Date(p.date || Date.now())
      })),
      ...filteredSessions.map(s => ({
        id: s.id,
        type: 'Sesión',
        name: `Sesión (${s.exercises?.length || 0} ejercicios)`,
        value: `${s.attendees?.length || 0} atletas`,
        userId: s.attendees?.[0] || '',
        date: s.date?.toDate ? s.date.toDate() : new Date(s.date || Date.now())
      }))
    ].sort((a, b) => b.date - a.date).slice(0, 8);
  }, [filteredRMRecords, filteredPowerRecords, filteredSessions]);

  const getAthleteName = (id) => {
    const a = athletes.find(x => x.id === id);
    return a ? a.name : 'Atleta';
  };

  const activeGroup = groups.find(g => g.id === selectedGroupFilter);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Botones de Acción Rápida */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button
          onClick={() => setCurrentPanel('sessions')}
          className="group relative bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-2xl shadow-lg shadow-red-950/40 hover:from-red-500 hover:to-red-600 transition-all duration-200 flex items-center justify-between text-left border border-red-500/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
              <CalendarPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold">Nueva Sesión</p>
              <p className="text-xs text-red-200">Registrar entrenamiento del día</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-red-200 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => setCurrentPanel('1rm')}
          className="group bg-slate-900 border border-slate-800 hover:border-slate-700 text-white p-6 rounded-2xl shadow-md hover:bg-slate-800/80 transition-all duration-200 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
              <TrendingUp className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-lg font-bold">Registrar 1RM</p>
              <p className="text-xs text-slate-400">Récords y cálculo Brzycki</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => setCurrentPanel('power')}
          className="group bg-slate-900 border border-slate-800 hover:border-slate-700 text-white p-6 rounded-2xl shadow-md hover:bg-slate-800/80 transition-all duration-200 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-bold">Registrar Potencia</p>
              <p className="text-xs text-slate-400">Saltos CMJ, balísticos y VBT</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </section>

      {/* Barra de Filtro por Grupo de Trabajo / Cuadrilla */}
      {groups.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
            <Layers className="w-3.5 h-3.5 text-red-500" />
            Cuadrilla:
          </span>

          <button
            onClick={() => setSelectedGroupFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              selectedGroupFilter === 'all'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <span>Todos los Atletas ({athletes.length})</span>
          </button>

          {groups.map(grp => {
            const isSelected = selectedGroupFilter === grp.id;
            const count = athletes.filter(a => 
              (a.groupIds && a.groupIds.includes(grp.id)) || 
              (grp.athleteIds && grp.athleteIds.includes(a.id))
            ).length;

            return (
              <button
                key={grp.id}
                onClick={() => setSelectedGroupFilter(grp.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? 'shadow-md text-white'
                    : 'hover:border-slate-600 opacity-80 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: isSelected ? grp.color : 'rgba(15, 23, 42, 0.8)',
                  borderColor: isSelected ? grp.color : 'rgba(51, 65, 85, 0.6)',
                  color: isSelected ? '#ffffff' : (grp.color || '#cbd5e1')
                }}
              >
                <span 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: isSelected ? '#ffffff' : grp.color }} 
                />
                <span>{grp.name}</span>
                <span 
                  className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold"
                  style={{ backgroundColor: isSelected ? 'rgba(0,0,0,0.25)' : `${grp.color}20` }}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {selectedGroupFilter !== 'all' && (
            <button
              onClick={() => setSelectedGroupFilter('all')}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-300 underline ml-2 shrink-0"
            >
              Ver todos
            </button>
          )}
        </div>
      )}

      {/* Tarjetas de Estadísticas / KPIs */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Atletas</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{filteredAthletes.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {selectedGroupFilter === 'all' ? 'Total en el gimnasio' : `En ${activeGroup?.name || 'cuadrilla'}`}
          </p>
        </div>

        <div 
          onClick={() => setCurrentPanel('athletes')}
          className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cuadrillas</span>
            <Layers className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-extrabold text-white">{groups.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Grupos registrados</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Sesiones</span>
            <ClipboardList className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{filteredSessions.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">Planificadas o hechas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Récords 1RM</span>
            <Award className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-extrabold text-white">{filteredRMRecords.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Marcas registradas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Test Potencia</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-white">{filteredPowerRecords.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Saltos y VBT</p>
        </div>
      </section>

      {/* Visión General del Volumen Semanal */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              <span>Carga de Entrenamiento Semanal (Tonelaje)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Volumen acumulado levantado por {selectedGroupFilter === 'all' ? 'el equipo' : activeGroup?.name} en las últimas 6 semanas
            </p>
          </div>
          <button
            onClick={() => setCurrentPanel('analysis')}
            className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
          >
            Ver Análisis VBT →
          </button>
        </div>
        <VolumeBarChart sessions={filteredSessions} rmRecords={filteredRMRecords} />
      </section>

      {/* Actividad Reciente y Atletas del Equipo */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              <span>Actividad y Registros Recientes</span>
            </h3>
            <button 
              onClick={() => setCurrentPanel('history')}
              className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
            >
              Ver todo el historial →
            </button>
          </div>

          {recentRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No hay actividad registrada aún para esta selección.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 overflow-hidden">
              {recentRecords.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${
                      item.type === '1RM' 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : item.type === 'Potencia'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {item.type}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.name}</p>
                      <p className="text-xs text-slate-400">{getAthleteName(item.userId)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono text-white">{item.value}</p>
                    <p className="text-[11px] text-slate-500">
                      {item.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel de Atletas Rápidos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>{selectedGroupFilter === 'all' ? 'Atletas del Equipo' : `Atletas (${activeGroup?.name})`}</span>
            </h3>
            <button 
              onClick={() => setCurrentPanel('athletes')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              Gestionar →
            </button>
          </div>

          <div className="space-y-3">
            {filteredAthletes.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No hay atletas asignados a este grupo.</p>
            ) : (
              filteredAthletes.slice(0, 6).map((athlete) => (
                <div 
                  key={athlete.id}
                  onClick={() => setCurrentPanel('athletes')}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors border border-slate-700/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white overflow-hidden">
                      {athlete.photoUrl ? (
                        <img src={athlete.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (athlete.name || 'A').charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{athlete.name}</p>
                      <p className="text-xs text-slate-400">{athlete.nickname || (athlete.weight ? `${athlete.weight} kg` : 'Atleta')}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
