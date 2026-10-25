import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AthleteModal } from './AthleteModal';
import { AthleteProfileModal } from './AthleteProfileModal';
import { GroupManagementModal } from './GroupManagementModal';
import { AthleteReportModal } from '../reports/AthleteReportModal';
import { GroupReportModal } from '../reports/GroupReportModal';
import { 
  Search, 
  UserPlus, 
  Eye, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  Layers,
  Filter,
  FileText,
  Trophy
} from 'lucide-react';

export const AthletesView = () => {
  const { athletes, groups, getAthleteGroups, rmRecords, powerRecords, deleteAthlete, setCurrentPanel } = useApp();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [athleteToEdit, setAthleteToEdit] = useState(null);
  const [selectedAthleteProfile, setSelectedAthleteProfile] = useState(null);
  const [athleteToDelete, setAthleteToDelete] = useState(null);
  const [reportAthlete, setReportAthlete] = useState(null);
  const [reportGroup, setReportGroup] = useState(null);

  // Filtrado de atletas por nombre y grupo de trabajo
  const filteredAthletes = athletes.filter(a => {
    const matchesSearch = (a.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.nickname || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (selectedGroupFilter === 'all') return true;

    const athleteGroups = getAthleteGroups(a);
    return athleteGroups.some(g => g.id === selectedGroupFilter);
  });

  // Helpers para mejores marcas
  const getBestLift = (athleteId, exerciseKeywords) => {
    const list = rmRecords
      .filter(r => r.userId === athleteId && exerciseKeywords.some(k => (r.exercise || '').toLowerCase().includes(k)))
      .sort((a, b) => b.weight - a.weight);
    return list[0]?.weight ? `${list[0].weight} kg` : '-';
  };

  const getBestJump = (athleteId) => {
    const list = powerRecords
      .filter(r => r.userId === athleteId && (r.exercise || '').toLowerCase().includes('salto') || (r.exercise || '').toLowerCase().includes('cmj'))
      .sort((a, b) => (b.distance || 0) - (a.distance || 0));
    return list[0]?.distance ? `${list[0].distance} cm` : '-';
  };

  const handleDeleteConfirm = async () => {
    if (athleteToDelete) {
      await deleteAthlete(athleteToDelete.id);
      setAthleteToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Barra superior de búsqueda y botones */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar atleta por nombre o apodo..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {selectedGroupFilter !== 'all' && (
            <button
              onClick={() => setReportGroup(groups.find(g => g.id === selectedGroupFilter))}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-amber-950/40 transition-all"
              title="Generar informe oficial de esta cuadrilla"
            >
              <Trophy className="w-4 h-4" />
              <span>Informe Cuadrilla</span>
            </button>
          )}

          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
            title="Administrar grupos de trabajo"
          >
            <Layers className="w-4 h-4 text-red-500" />
            <span>Grupos ({groups.length})</span>
          </button>

          <button
            onClick={() => {
              setAthleteToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-red-900/30 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Añadir Atleta</span>
          </button>
        </div>
      </div>

      {/* Selector / Filtro por Grupos de Trabajo */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
        <button
          onClick={() => setSelectedGroupFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            selectedGroupFilter === 'all'
              ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <span>Todos los Atletas</span>
          <span className="text-[10px] bg-black/25 px-1.5 py-0.2 rounded-full font-mono">
            {athletes.length}
          </span>
        </button>

        {groups.map(grp => {
          const count = athletes.filter(a => 
            (a.groupIds && a.groupIds.includes(grp.id)) || 
            (grp.athleteIds && grp.athleteIds.includes(a.id))
          ).length;
          const isSelected = selectedGroupFilter === grp.id;

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

        <button
          onClick={() => setIsGroupModalOpen(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/60 border border-dashed border-slate-700 hover:border-slate-500 transition-all shrink-0 flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-red-500" />
          <span>+ Nuevo Grupo</span>
        </button>
      </div>

      {/* Tabla de Atletas */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">Atleta</th>
                <th className="py-4 px-4 text-center">Peso</th>
                <th className="py-4 px-4 text-center">Sentadilla (1RM)</th>
                <th className="py-4 px-4 text-center">Arranque (1RM)</th>
                <th className="py-4 px-4 text-center">Salto CMJ</th>
                <th className="py-4 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredAthletes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    {searchTerm || selectedGroupFilter !== 'all' 
                      ? 'No se encontraron atletas con ese criterio o en este grupo.' 
                      : 'No hay atletas registrados aún.'}
                  </td>
                </tr>
              ) : (
                filteredAthletes.map((athlete) => (
                  <tr key={athlete.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white overflow-hidden flex-shrink-0">
                          {athlete.photoUrl ? (
                            <img src={athlete.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (athlete.name || 'A').charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white leading-tight">{athlete.name}</p>
                          {athlete.nickname && (
                            <p className="text-xs text-slate-400 font-medium">"{athlete.nickname}"</p>
                          )}
                          {/* Insignias de Grupos */}
                          {(() => {
                            const athleteGroups = getAthleteGroups(athlete);
                            if (athleteGroups.length === 0) return null;
                            return (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {athleteGroups.map(g => (
                                  <span
                                    key={g.id}
                                    className="text-[9px] font-bold px-1.5 py-0.2 rounded-md border"
                                    style={{
                                      backgroundColor: `${g.color}15`,
                                      color: g.color,
                                      borderColor: `${g.color}35`
                                    }}
                                  >
                                    {g.name}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                      {athlete.weight ? `${athlete.weight} kg` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-white">
                      {getBestLift(athlete.id, ['sentadilla'])}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-white">
                      {getBestLift(athlete.id, ['arranque', 'snatch'])}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-amber-400">
                      {getBestJump(athlete.id)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setReportAthlete(athlete)}
                          title="Ficha Oficial & Reporte (PDF / WhatsApp)"
                          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedAthleteProfile(athlete)}
                          title="Observar Perfil y KPIs"
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setAthleteToEdit(athlete);
                            setIsModalOpen(true);
                          }}
                          title="Editar Atleta"
                          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setAthleteToDelete(athlete)}
                          title="Eliminar Atleta"
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Formulario Atleta */}
      <AthleteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        athleteToEdit={athleteToEdit}
      />

      {/* Modal de Gestión de Grupos de Trabajo */}
      <GroupManagementModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />

      {/* Modal Observar Perfil */}
      <AthleteProfileModal
        isOpen={!!selectedAthleteProfile}
        athlete={selectedAthleteProfile}
        onClose={() => setSelectedAthleteProfile(null)}
        onGoToHistory={() => setCurrentPanel('history')}
      />

      {/* Modal Ficha Oficial & Reporte Atleta */}
      <AthleteReportModal
        athlete={reportAthlete}
        isOpen={!!reportAthlete}
        onClose={() => setReportAthlete(null)}
      />

      {/* Modal Reporte de Cuadrilla */}
      <GroupReportModal
        group={reportGroup}
        isOpen={!!reportGroup}
        onClose={() => setReportGroup(null)}
      />

      {/* Modal Confirmación de Borrado */}
      {athleteToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">¿Eliminar a {athleteToDelete.name}?</h3>
            </div>
            <p className="text-sm text-slate-300 mb-6">
              Esta acción no se puede deshacer. Se borrarán permanentemente todos sus récords personales de 1RM y potencia.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAthleteToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-md shadow-red-950/40"
              >
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
