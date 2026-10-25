import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Trophy, Award, Flame, Star, Shield, Users } from 'lucide-react';

export const AchievementsView = () => {
  const { athletes, rmRecords, powerRecords } = useApp();
  const [selectedAthleteId, setSelectedAthleteId] = useState(athletes[0]?.id || '');
  const [leaderboardExercise, setLeaderboardExercise] = useState('Sentadilla (Squat)');

  const currentAthlete = athletes.find(a => a.id === selectedAthleteId) || athletes[0];

  // Helper de cálculo de logros para un atleta
  const getAthleteMax1RM = (athleteId, exerciseKeywords) => {
    return rmRecords
      .filter(r => r.userId === athleteId && exerciseKeywords.some(k => (r.exercise || '').toLowerCase().includes(k)))
      .reduce((max, r) => Math.max(max, r.weight || 0), 0);
  };

  const getAthleteBestJump = (athleteId) => {
    return powerRecords
      .filter(r => r.userId === athleteId && (r.exercise || '').toLowerCase().includes('salto') || (r.exercise || '').toLowerCase().includes('cmj'))
      .reduce((max, r) => Math.max(max, r.distance || 0), 0);
  };

  const bw = currentAthlete?.weight || 0;
  const maxSquat = currentAthlete ? getAthleteMax1RM(currentAthlete.id, ['sentadilla']) : 0;
  const maxBench = currentAthlete ? getAthleteMax1RM(currentAthlete.id, ['banca', 'bench']) : 0;
  const maxDeadlift = currentAthlete ? getAthleteMax1RM(currentAthlete.id, ['peso muerto', 'deadlift']) : 0;
  const maxJump = currentAthlete ? getAthleteBestJump(currentAthlete.id) : 0;

  const badges = [
    {
      group: 'Fuerza Relativa',
      title: 'Club 1.5x BW Sentadilla',
      desc: 'Sentadilla >= 1.5 veces tu peso corporal',
      icon: Flame,
      unlocked: bw > 0 && maxSquat >= bw * 1.5
    },
    {
      group: 'Fuerza Relativa',
      title: 'Club 2.0x BW Sentadilla',
      desc: 'Sentadilla >= 2.0 veces tu peso corporal',
      icon: Trophy,
      unlocked: bw > 0 && maxSquat >= bw * 2.0
    },
    {
      group: 'Fuerza Relativa',
      title: 'Club 1.0x BW Press Banca',
      desc: 'Press Banca >= 1.0 veces tu peso corporal',
      icon: Shield,
      unlocked: bw > 0 && maxBench >= bw * 1.0
    },
    {
      group: 'Fuerza Absoluta',
      title: 'Club 100kg Banca',
      desc: 'Levantar 100 kg o más en Press Banca',
      icon: Award,
      unlocked: maxBench >= 100
    },
    {
      group: 'Fuerza Absoluta',
      title: 'Club 150kg Sentadilla',
      desc: 'Levantar 150 kg o más en Sentadilla',
      icon: Star,
      unlocked: maxSquat >= 150
    },
    {
      group: 'Fuerza Absoluta',
      title: 'Club 200kg Peso Muerto',
      desc: 'Levantar 200 kg o más en Peso Muerto',
      icon: Trophy,
      unlocked: maxDeadlift >= 200
    },
    {
      group: 'Potencia y Salto',
      title: 'Salto Élite (50 cm)',
      desc: 'Alcanzar 50 cm en salto vertical / CMJ',
      icon: Flame,
      unlocked: maxJump >= 50
    },
    {
      group: 'Potencia y Salto',
      title: 'Salto Pro (60 cm)',
      desc: 'Alcanzar 60 cm en salto vertical / CMJ',
      icon: Star,
      unlocked: maxJump >= 60
    }
  ];

  // Leaderboard dinámico por ejercicio
  const leaderboardList = athletes.map(a => {
    let best = 0;
    if (leaderboardExercise.includes('CMJ')) {
      best = getAthleteBestJump(a.id);
    } else {
      best = getAthleteMax1RM(a.id, [leaderboardExercise.toLowerCase().split(' ')[0]]);
    }
    return {
      athlete: a,
      value: best,
      unit: leaderboardExercise.includes('CMJ') ? 'cm' : 'kg'
    };
  }).filter(x => x.value > 0).sort((a, b) => b.value - a.value);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-150">
      {/* Logros Individuales */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Insignias y Logros</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Hitos desbloqueados según métricas de fuerza</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Atleta:</span>
            <select
              value={selectedAthleteId}
              onChange={e => setSelectedAthleteId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {athletes.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {badges.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                  b.unlocked
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-800/40 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    b.unlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${b.unlocked ? 'text-white' : 'text-slate-400'}`}>
                      {b.title}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight">{b.desc}</p>
                  </div>
                </div>

                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  b.unlocked
                    ? 'bg-emerald-500 text-slate-950 uppercase tracking-wide'
                    : 'bg-slate-800 text-slate-500 uppercase tracking-wide'
                }`}>
                  {b.unlocked ? 'Desbloqueado' : 'Bloqueado'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard del Equipo */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-red-500" />
              <span>Leaderboard del Equipo</span>
            </h3>

            <select
              value={leaderboardExercise}
              onChange={e => setLeaderboardExercise(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="Sentadilla (Squat)">Sentadilla</option>
              <option value="Press Banca">Press Banca</option>
              <option value="Peso Muerto">Peso Muerto</option>
              <option value="Arranque">Arranque (Snatch)</option>
              <option value="Salto CMJ">Salto CMJ</option>
            </select>
          </div>

          <div className="space-y-2.5">
            {leaderboardList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">No hay registros para este ejercicio aún.</p>
            ) : (
              leaderboardList.map((item, index) => (
                <div
                  key={item.athlete.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border ${
                    index === 0
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : index === 1
                      ? 'bg-slate-300/10 border-slate-400/20'
                      : index === 2
                      ? 'bg-amber-700/10 border-amber-700/20'
                      : 'bg-slate-800/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      index === 0 ? 'bg-amber-400 text-slate-950 font-black' :
                      index === 1 ? 'bg-slate-300 text-slate-950 font-bold' :
                      index === 2 ? 'bg-amber-700 text-white font-bold' :
                      'text-slate-500'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-sm font-bold text-white">{item.athlete.name}</span>
                  </div>
                  <span className="text-base font-black font-mono text-emerald-400">
                    {item.value} {item.unit}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
