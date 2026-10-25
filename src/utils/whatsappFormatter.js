// src/utils/whatsappFormatter.js

/**
 * Limpia y normaliza un número de teléfono para WhatsApp.
 * Si no incluye prefijo país (ej. +56 para Chile), se puede añadir por defecto.
 */
export const sanitizePhoneNumber = (phone) => {
  if (!phone) return '';
  // Quitar espacios, guiones, paréntesis
  let cleaned = phone.replace(/[^0-9+]/g, '');
  // Si empieza con +, quitar el + para wa.me
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
};

/**
 * Abre WhatsApp con un mensaje pre-formateado.
 * Si hay número, abre el chat directo; si no, abre el selector de contactos.
 */
export const openWhatsApp = ({ phone = '', text = '' }) => {
  const cleanPhone = sanitizePhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  
  let url = '';
  if (cleanPhone) {
    url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  } else {
    url = `https://wa.me/?text=${encodedText}`;
  }
  
  // Abrir en nueva ventana o redireccionar
  window.open(url, '_blank');
};

/**
 * Genera el texto estructurado para WhatsApp de la Ficha Técnica Individual
 */
export const generateAthleteWhatsAppReport = ({
  athlete,
  coachName = 'Head Coach',
  coachTitle = 'Máxima Potencia',
  bestSquat = 0,
  bestBench = 0,
  bestDeadlift = 0,
  bestSnatch = 0,
  bestCMJ = 0,
  maxVelocity = 0,
  coachNotes = '',
  groups = []
}) => {
  const weight = athlete.weight || 0;
  const relSquat = weight > 0 && bestSquat > 0 ? (bestSquat / weight).toFixed(2) : '-';
  const relBench = weight > 0 && bestBench > 0 ? (bestBench / weight).toFixed(2) : '-';
  const relDeadlift = weight > 0 && bestDeadlift > 0 ? (bestDeadlift / weight).toFixed(2) : '-';

  const groupNames = groups.map(g => g.name).join(', ') || 'General';
  const today = new Date().toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  let message = `🔥 *MÁXIMA POTENCIA* | _Ficha de Rendimiento_ 🔥\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `👤 *Atleta:* ${athlete.name}${athlete.nickname ? ` ("${athlete.nickname}")` : ''}\n`;
  message += `👥 *Cuadrilla:* ${groupNames}\n`;
  message += `⚖️ *Peso Corporal:* ${weight ? `${weight} kg` : 'N/A'}${athlete.height ? ` | *Talla:* ${athlete.height} cm` : ''}\n`;
  message += `📅 *Fecha Evaluación:* ${today}\n`;
  message += `👑 *Coach Evaluador:* ${coachName} (${coachTitle})\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `🏋️‍♂️ *RÉCORDS 1RM & FUERZA MÁXIMA*\n`;
  if (bestSquat > 0) {
    message += `• *Sentadilla:* ${bestSquat} kg _(${relSquat}x peso corp.)_\n`;
  }
  if (bestBench > 0) {
    message += `• *Press Banca:* ${bestBench} kg _(${relBench}x peso corp.)_\n`;
  }
  if (bestDeadlift > 0) {
    message += `• *Peso Muerto:* ${bestDeadlift} kg _(${relDeadlift}x peso corp.)_\n`;
  }
  if (bestSnatch > 0) {
    message += `• *Arranque Olímpico:* ${bestSnatch} kg\n`;
  }
  if (bestSquat === 0 && bestBench === 0 && bestDeadlift === 0 && bestSnatch === 0) {
    message += `• _Sin levantamientos registrados_\n`;
  }

  message += `\n⚡ *POTENCIA & VBT (CÁMARA / SENSORES)*\n`;
  if (bestCMJ > 0) {
    message += `• *Salto Vertical (CMJ):* ${bestCMJ} cm\n`;
  }
  if (maxVelocity > 0) {
    message += `• *Velocidad Barra (VBT):* ${maxVelocity} m/s\n`;
  }
  if (bestCMJ === 0 && maxVelocity === 0) {
    message += `• _Evaluaciones de potencia pendientes_\n`;
  }

  if (coachNotes && coachNotes.trim()) {
    message += `\n📝 *DIAGNÓSTICO & NOTAS DEL COACH*\n`;
    message += `"${coachNotes.trim()}"\n`;
  }

  message += `\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🚀 *¡A seguir superando marcas!* #MáximaPotencia #VBT`;

  return message;
};

/**
 * Genera el texto estructurado para WhatsApp del Reporte de Cuadrilla / Grupo
 */
export const generateGroupWhatsAppReport = ({
  group,
  coachName = 'Head Coach',
  athletes = [],
  groupStats = {}
}) => {
  const today = new Date().toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  let message = `🏆 *INFORME DE CUADRILLA: ${group.name.toUpperCase()}* 🏆\n`;
  message += `*Máxima Potencia Centro de Alto Rendimiento*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🛡️ *Coach Responsable:* ${coachName}\n`;
  message += `👥 *Atletas Evaluados:* ${athletes.length}\n`;
  message += `📅 *Fecha:* ${today}\n`;
  if (group.schedule) {
    message += `⏰ *Horario:* ${group.schedule}\n`;
  }
  message += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `📊 *PROMEDIOS DE LA CUADRILLA:*\n`;
  if (groupStats.avgWeight) message += `• Peso promedio: ${groupStats.avgWeight} kg\n`;
  if (groupStats.avgSquat) message += `• Sentadilla media: ${groupStats.avgSquat} kg\n`;
  if (groupStats.avgBench) message += `• Press Banca media: ${groupStats.avgBench} kg\n`;
  if (groupStats.avgCMJ) message += `• Salto CMJ promedio: ${groupStats.avgCMJ} cm\n`;

  if (groupStats.topLifters && groupStats.topLifters.length > 0) {
    message += `\n🥇 *PODIO FUERZA RELATIVA (x Peso Corporal):*\n`;
    groupStats.topLifters.slice(0, 3).forEach((item, idx) => {
      const medals = ['🥇', '🥈', '🥉'];
      message += `${medals[idx]} *${item.name}:* ${item.ratio}x BW (${item.exercise} ${item.weight}kg)\n`;
    });
  }

  if (groupStats.topJumpers && groupStats.topJumpers.length > 0) {
    message += `\n🚀 *TOP SALTADORES (CMJ):*\n`;
    groupStats.topJumpers.slice(0, 3).forEach((item, idx) => {
      const medals = ['🥇', '🥈', '🥉'];
      message += `${medals[idx]} *${item.name}:* ${item.height} cm\n`;
    });
  }

  message += `\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💪 *¡Excelente trabajo equipo! La constancia forja campeones.*`;

  return message;
};
