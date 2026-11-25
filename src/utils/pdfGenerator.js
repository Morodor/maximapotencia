// src/utils/pdfGenerator.js
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const getPalette = (theme = 'light') => {
  const isDark = theme === 'dark';
  return isDark
    ? {
        isDark: true,
        pageBg: [11, 15, 25],
        cardBg: [18, 25, 40],
        cardAltBg: [24, 33, 52],
        border: [45, 58, 82],
        text: [248, 250, 252],
        muted: [148, 163, 184],
        subtle: [100, 116, 139],
        accent: [220, 38, 38],
        accentSoft: [55, 20, 28],
        accentText: [248, 113, 113],
        amber: [245, 158, 11],
        emerald: [16, 185, 129],
        grid: [51, 65, 85],
        radarFill: [120, 32, 42]
      }
    : {
        isDark: false,
        pageBg: [255, 255, 255],
        cardBg: [248, 250, 252],
        cardAltBg: [241, 245, 249],
        border: [203, 213, 225],
        text: [15, 23, 42],
        muted: [71, 85, 105],
        subtle: [100, 116, 139],
        accent: [220, 38, 38],
        accentSoft: [254, 226, 226],
        accentText: [185, 28, 28],
        amber: [217, 119, 6],
        emerald: [5, 150, 105],
        grid: [203, 213, 225],
        radarFill: [252, 196, 196]
      };
};

const hexToRgb = (hex, fallback = [220, 38, 38]) => {
  if (!hex || typeof hex !== 'string') return fallback;
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16) || fallback[0],
      parseInt(clean[1] + clean[1], 16) || fallback[1],
      parseInt(clean[2] + clean[2], 16) || fallback[2]
    ];
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16) || fallback[0],
      parseInt(clean.slice(2, 4), 16) || fallback[1],
      parseInt(clean.slice(4, 6), 16) || fallback[2]
    ];
  }
  return fallback;
};

// Elimina emojis o caracteres fuera del rango Latin-1 soportado por la fuente Helvetica de jsPDF
const pdfText = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const loadImageAsJpegDataUrl = (src) => {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timeoutId = setTimeout(() => resolve(null), 3500);

    img.onload = () => {
      clearTimeout(timeoutId);
      try {
        const size = 240;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = Math.max(0, (img.width - minSide) / 2);
        const sy = Math.max(0, (img.height - minSide) / 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve(null);
    };
    img.src = src;
  });
};

const paintPageBackground = (doc, pal) => {
  doc.setFillColor(...pal.pageBg);
  doc.rect(0, 0, 210, 297, 'F');
};

const ensureSpace = (doc, currentY, neededMm, pal, marginTop = 16) => {
  if (currentY + neededMm > 278) {
    doc.addPage();
    paintPageBackground(doc, pal);
    return marginTop;
  }
  return currentY;
};

const drawVectorRadar = (doc, cx, cy, radius, radarData = {}, pal) => {
  const axes = [
    { label: 'Sentadilla', raw: radarData.squatRaw || 'N/R', score: radarData.squatScore || 20 },
    { label: 'Banca', raw: radarData.benchRaw || 'N/R', score: radarData.benchScore || 20 },
    { label: 'P. Muerto', raw: radarData.deadliftRaw || 'N/R', score: radarData.deadliftScore || 20 },
    { label: 'Salto CMJ', raw: radarData.jumpRaw || 'N/R', score: radarData.jumpScore || 20 },
    { label: 'Vel. VBT', raw: radarData.vbtRaw || 'N/R', score: radarData.vbtScore || 20 }
  ];

  const totalAxes = axes.length;
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getPt = (idx, ratio) => {
    const angle = ((Math.PI * 2) / totalAxes) * idx - Math.PI / 2;
    const r = radius * ratio;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  };

  // Polígonos concéntricos
  levels.forEach((lvl, lvlIdx) => {
    doc.setDrawColor(...pal.grid);
    doc.setLineWidth(lvlIdx === levels.length - 1 ? 0.4 : 0.2);
    const pts = axes.map((_, i) => getPt(i, lvl));
    for (let i = 0; i < pts.length; i++) {
      const next = pts[(i + 1) % pts.length];
      doc.line(pts[i].x, pts[i].y, next.x, next.y);
    }
  });

  // Ejes radiales
  doc.setDrawColor(...pal.grid);
  doc.setLineWidth(0.2);
  axes.forEach((_, i) => {
    const outer = getPt(i, 1.0);
    doc.line(cx, cy, outer.x, outer.y);
  });

  // Polígono de datos del atleta (relleno vectorial limpio)
  const dataPts = axes.map((a, i) => {
    const ratio = Math.max(0.1, Math.min(1.0, (a.score || 20) / 100));
    return getPt(i, ratio);
  });

  if (doc.setGState && doc.GState) {
    doc.setGState(new doc.GState({ opacity: pal.isDark ? 0.4 : 0.25 }));
  }
  doc.setFillColor(...pal.accent);
  const deltas = [];
  for (let i = 1; i < dataPts.length; i++) {
    deltas.push([dataPts[i].x - dataPts[i - 1].x, dataPts[i].y - dataPts[i - 1].y]);
  }
  deltas.push([dataPts[0].x - dataPts[dataPts.length - 1].x, dataPts[0].y - dataPts[dataPts.length - 1].y]);
  doc.lines(deltas, dataPts[0].x, dataPts[0].y, [1, 1], 'F', true);

  if (doc.setGState && doc.GState) {
    doc.setGState(new doc.GState({ opacity: 1 }));
  }

  doc.setDrawColor(...pal.accent);
  doc.setLineWidth(0.75);
  for (let i = 0; i < dataPts.length; i++) {
    const next = dataPts[(i + 1) % dataPts.length];
    doc.line(dataPts[i].x, dataPts[i].y, next.x, next.y);
  }

  // Vértices
  dataPts.forEach((p) => {
    doc.setFillColor(...pal.accent);
    doc.setDrawColor(...pal.pageBg);
    doc.setLineWidth(0.4);
    doc.circle(p.x, p.y, 1.25, 'FD');
  });

  // Etiquetas exteriores
  axes.forEach((axis, i) => {
    const labelPt = getPt(i, 1.28);
    let align = 'center';
    if (labelPt.x < cx - 6) align = 'right';
    if (labelPt.x > cx + 6) align = 'left';

    const yOffset = i === 0 ? -1.5 : (i === 2 || i === 3 ? 2 : 0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...pal.text);
    doc.text(pdfText(axis.label), labelPt.x, labelPt.y + yOffset, { align });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.4);
    doc.setTextColor(...pal.muted);
    doc.text(pdfText(`${axis.raw} (${axis.score})`), labelPt.x, labelPt.y + yOffset + 3.2, { align });
  });
};

/**
 * Genera un Informe Oficial A4 Vectorial nativo para un Atleta y lo descarga directo como PDF.
 */
export const generateAthletePdfReport = async ({
  athlete,
  athleteGroups = [],
  currentCoach = null,
  gymName = 'Máxima Potencia Club',
  bestSquat = 0,
  bestBench = 0,
  bestDeadlift = 0,
  bestSnatch = 0,
  bestCMJ = 0,
  maxVelocity = 0,
  relSquat = '-',
  relBench = '-',
  relDeadlift = '-',
  radarData = {},
  progressions = [],
  coachNotes = '',
  theme = 'light'
}) => {
  if (!athlete) {
    throw new Error('No se proporcionó un atleta válido para generar el PDF.');
  }

  const pal = getPalette(theme);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  paintPageBackground(doc, pal);

  const margin = 14;
  const contentWidth = 210 - margin * 2;
  let y = 14;

  // 1. HEADER OFICIAL
  doc.setFillColor(...pal.accent);
  doc.roundedRect(margin, y, 13, 13, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('MP', margin + 6.5, y + 8.3, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...pal.text);
  doc.text('MAXIMA POTENCIA', margin + 17, y + 5.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(...pal.accentText);
  doc.text(pdfText(`FICHA TECNICA & ANALISIS DE RENDIMIENTO  |  ${gymName}`), margin + 17, y + 10.6);

  const docCode = `DOC #MP-${(athlete.id || '001').slice(0, 6).toUpperCase()}`;
  const formattedDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const coachName = pdfText(currentCoach?.name || 'Bayron Quezada');

  doc.setFillColor(...pal.accentSoft);
  doc.setDrawColor(...pal.accent);
  doc.setLineWidth(0.25);
  doc.roundedRect(210 - margin - 34, y, 34, 5.5, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...pal.accentText);
  doc.text(docCode, 210 - margin - 17, y + 3.8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...pal.muted);
  doc.text(pdfText(`Fecha: ${formattedDate}`), 210 - margin, y + 9, { align: 'right' });
  doc.text(pdfText(`Evaluador: ${coachName}`), 210 - margin, y + 12.6, { align: 'right' });

  y += 17;
  doc.setDrawColor(...pal.border);
  doc.setLineWidth(0.35);
  doc.line(margin, y, 210 - margin, y);
  y += 5;

  // 2. IDENTIDAD DEL ATLETA & BIOMETRIA
  const photoDataUrl = await loadImageAsJpegDataUrl(athlete.photoUrl || athlete.avatarUrl || '');
  const athColor = hexToRgb(athlete.color, pal.accent);

  if (photoDataUrl) {
    doc.addImage(photoDataUrl, 'JPEG', margin, y, 18, 18);
    doc.setDrawColor(...pal.accent);
    doc.setLineWidth(0.45);
    doc.roundedRect(margin, y, 18, 18, 2, 2, 'S');
  } else {
    doc.setFillColor(...athColor);
    doc.roundedRect(margin, y, 18, 18, 3, 3, 'F');
    const initials = pdfText(athlete.name || 'AT')
      .split(/\s+/)
      .map(p => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'AT';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(initials, margin + 9, y + 11.2, { align: 'center' });
  }

  const infoX = margin + 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...pal.text);
  doc.text(pdfText(athlete.name || 'Atleta'), infoX, y + 6);

  let subY = y + 10.5;
  if (athlete.nickname) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(...pal.accentText);
    doc.text(pdfText(`"${athlete.nickname}"`), infoX, subY);
    subY += 4.2;
  }

  if (athleteGroups.length > 0) {
    const groupText = athleteGroups.map(g => g.name).join('  |  ');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...pal.muted);
    doc.text(pdfText(`Cuadrilla: ${groupText}`), infoX, subY);
  }

  // 3 Cajas Biométricas (derecha)
  const bioWidth = 22;
  const bioGap = 2.5;
  const bioStartX = 210 - margin - (bioWidth * 3 + bioGap * 2);
  const bioBoxes = [
    { label: 'PESO', val: athlete.weight ? `${athlete.weight} kg` : '-', color: pal.text },
    { label: 'TALLA', val: athlete.height ? `${athlete.height} cm` : '-', color: pal.text },
    { label: 'F. RELATIVA', val: relSquat !== '-' ? `${relSquat}x` : '-', color: pal.accentText }
  ];

  bioBoxes.forEach((box, idx) => {
    const bx = bioStartX + idx * (bioWidth + bioGap);
    doc.setFillColor(...pal.cardBg);
    doc.setDrawColor(...pal.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(bx, y + 1, bioWidth, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...pal.muted);
    doc.text(box.label, bx + bioWidth / 2, y + 6, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...box.color);
    doc.text(pdfText(box.val), bx + bioWidth / 2, y + 12.8, { align: 'center' });
  });

  y += 22;
  doc.setDrawColor(...pal.border);
  doc.setLineWidth(0.35);
  doc.line(margin, y, 210 - margin, y);
  y += 6;

  // 3. RADAR 5D + METRICAS CLAVE DE RENDIMIENTO
  const leftColW = 86;
  const rightColX = margin + leftColW + 6;
  const rightColW = contentWidth - leftColW - 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...pal.text);
  doc.text('PERFIL NEUROMUSCULAR & FUERZA (RADAR 5D)', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...pal.muted);
  doc.text('Simetria entre tren inferior, empuje, traccion y potencia VBT.', margin, y + 4);

  // Caja del Radar
  doc.setFillColor(...pal.cardBg);
  doc.setDrawColor(...pal.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, y + 7, leftColW, 74, 2.5, 2.5, 'FD');
  drawVectorRadar(doc, margin + leftColW / 2, y + 44.5, 22, radarData, pal);

  // Columna derecha: Métricas clave
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...pal.text);
  doc.text('METRICAS CLAVE DE RENDIMIENTO', rightColX, y);

  const metricRows = [
    {
      title: 'SENTADILLA (1RM)',
      value: bestSquat > 0 ? `${bestSquat} kg` : 'Sin registro',
      badge: `${relSquat}x BW`,
      valColor: bestSquat > 0 ? pal.accentText : pal.muted
    },
    {
      title: 'PRESS BANCA (1RM)',
      value: bestBench > 0 ? `${bestBench} kg` : 'Sin registro',
      badge: `${relBench}x BW`,
      valColor: bestBench > 0 ? pal.text : pal.muted
    },
    {
      title: 'PESO MUERTO (1RM)',
      value: bestDeadlift > 0 ? `${bestDeadlift} kg` : 'Sin registro',
      badge: `${relDeadlift}x BW`,
      valColor: bestDeadlift > 0 ? pal.text : pal.muted
    },
    {
      title: 'ARRANQUE / SNATCH (1RM)',
      value: bestSnatch > 0 ? `${bestSnatch} kg` : 'Sin registro',
      badge: athlete.weight > 0 && bestSnatch > 0 ? `${(bestSnatch / athlete.weight).toFixed(2)}x BW` : 'Halterofilia',
      valColor: bestSnatch > 0 ? pal.emerald : pal.muted
    },
    {
      title: 'SALTO VERTICAL CMJ & VBT',
      value: bestCMJ > 0 ? `${bestCMJ} cm` : 'Sin registro',
      badge: maxVelocity > 0 ? `${maxVelocity} m/s` : 'Potencia',
      valColor: bestCMJ > 0 ? pal.amber : pal.muted
    }
  ];

  let my = y + 7;
  metricRows.forEach((m) => {
    doc.setFillColor(...pal.cardBg);
    doc.setDrawColor(...pal.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(rightColX, my, rightColW, 13.4, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(...pal.muted);
    doc.text(m.title, rightColX + 3.5, my + 4.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...m.valColor);
    doc.text(pdfText(m.value), rightColX + 3.5, my + 10.5);

    doc.setFillColor(...pal.cardAltBg);
    doc.roundedRect(rightColX + rightColW - 24, my + 3.5, 20.5, 6.4, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...pal.text);
    doc.text(pdfText(m.badge), rightColX + rightColW - 13.75, my + 7.8, { align: 'center' });

    my += 15.1;
  });

  y += 86;
  doc.setDrawColor(...pal.border);
  doc.setLineWidth(0.35);
  doc.line(margin, y, 210 - margin, y);
  y += 6;

  // 4. PROGRESION DE FUERZA
  if (progressions.length > 0) {
    y = ensureSpace(doc, y, 24 + progressions.length * 8, pal);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...pal.text);
    doc.text('HISTORIAL DE GANANCIA DE FUERZA & PROGRESION', margin, y);
    y += 4;

    // Header tabla
    doc.setFillColor(...pal.cardAltBg);
    doc.roundedRect(margin, y, contentWidth, 7.5, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...pal.muted);
    doc.text('Ejercicio', margin + 3.5, y + 5);
    doc.text('Marca Inicial', margin + 96, y + 5, { align: 'center' });
    doc.text('Record Actual', margin + 132, y + 5, { align: 'center' });
    doc.text('Ganancia (%)', 210 - margin - 3.5, y + 5, { align: 'right' });
    y += 8.5;

    progressions.forEach((p, idx) => {
      y = ensureSpace(doc, y, 8, pal);
      if (idx % 2 === 1) {
        doc.setFillColor(...pal.cardBg);
        doc.rect(margin, y - 0.5, contentWidth, 7, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(...pal.text);
      doc.text(pdfText(p.exercise).slice(0, 42), margin + 3.5, y + 4.3);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...pal.muted);
      doc.text(`${p.initial} kg`, margin + 96, y + 4.3, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...pal.text);
      doc.text(`${p.current} kg`, margin + 132, y + 4.3, { align: 'center' });

      doc.setTextColor(...(p.increasePct > 0 ? pal.emerald : pal.muted));
      doc.text(p.increasePct > 0 ? `+${p.increasePct}%` : 'Base', 210 - margin - 3.5, y + 4.3, { align: 'right' });

      y += 7;
    });

    y += 4;
    doc.setDrawColor(...pal.border);
    doc.setLineWidth(0.35);
    doc.line(margin, y, 210 - margin, y);
    y += 6;
  }

  // 5. OBSERVACIONES TECNICAS & PLANIFICACION
  const notesText = pdfText(coachNotes || 'Sin observaciones adicionales registradas.');
  const noteLines = doc.splitTextToSize(notesText, contentWidth - 8);
  const notesBoxHeight = Math.max(18, noteLines.length * 4.5 + 8);
  y = ensureSpace(doc, y, notesBoxHeight + 30, pal);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...pal.text);
  doc.text('OBSERVACIONES TECNICAS & PLANIFICACION RECOMENDADA', margin, y);
  y += 4;

  doc.setFillColor(...pal.cardBg);
  doc.setDrawColor(...pal.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, y, contentWidth, notesBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.3);
  doc.setTextColor(...pal.text);
  doc.text(noteLines, margin + 4, y + 6);

  y += notesBoxHeight + 10;

  // 6. PIE OFICIAL Y FIRMA DEL COACH
  const footerY = Math.max(y, 268);
  if (footerY > 276) {
    doc.addPage();
    paintPageBackground(doc, pal);
  }
  const fy = footerY > 276 ? 260 : footerY;

  doc.setDrawColor(...pal.border);
  doc.setLineWidth(0.3);
  doc.line(margin, fy, 210 - margin, fy);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...pal.muted);
  doc.text('Informe expedido por Maxima Potencia Performance System', margin, fy + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...pal.subtle);
  doc.text('Medicion VBT, 1RM & Biomecanica Deportiva', margin, fy + 10);

  doc.setDrawColor(...pal.border);
  doc.line(210 - margin - 52, fy + 6, 210 - margin, fy + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...pal.text);
  doc.text(coachName, 210 - margin, fy + 10.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(...pal.accentText);
  doc.text(pdfText(currentCoach?.title || 'Head Coach & Director Tecnico').toUpperCase(), 210 - margin, fy + 14.2, { align: 'right' });

  const sanitizedName = pdfText(athlete.name || 'atleta')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'atleta';
  doc.save(`ficha_${sanitizedName}_maxima_potencia.pdf`);
  return true;
};

/**
 * Genera un Informe Oficial A4 Vectorial nativo para una Cuadrilla / Grupo y lo descarga directo como PDF.
 */
export const generateGroupPdfReport = async ({
  group,
  groupAthletes = [],
  assignedCoach = null,
  gymName = 'Máxima Potencia Club',
  stats = {},
  theme = 'light'
}) => {
  if (!group) {
    throw new Error('No se proporcionó una cuadrilla válida para generar el PDF.');
  }

  const pal = getPalette(theme);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  paintPageBackground(doc, pal);

  const margin = 14;
  const contentWidth = 210 - margin * 2;
  let y = 14;
  const grpColor = hexToRgb(group.color, pal.accent);

  // Header Cuadrilla
  doc.setFillColor(...grpColor);
  doc.roundedRect(margin, y, 13, 13, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(pdfText((group.name || 'G').charAt(0).toUpperCase()), margin + 6.5, y + 8.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(...pal.text);
  doc.text(pdfText(`CUADRILLA: ${group.name}`).toUpperCase(), margin + 17, y + 5.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(...pal.accentText);
  doc.text(pdfText(`INFORME COLECTIVO DE RENDIMIENTO  |  ${gymName}`), margin + 17, y + 10.6);

  const coachName = pdfText(assignedCoach?.name || 'Bayron Quezada');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...pal.text);
  doc.text(`${groupAthletes.length} Atletas Registrados`, 210 - margin, y + 5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...pal.muted);
  doc.text(pdfText(`Coach: ${coachName}`), 210 - margin, y + 9, { align: 'right' });
  if (group.schedule) {
    doc.text(pdfText(`Horario: ${group.schedule}`), 210 - margin, y + 12.8, { align: 'right' });
  }

  y += 17;
  doc.setDrawColor(...pal.border);
  doc.setLineWidth(0.35);
  doc.line(margin, y, 210 - margin, y);
  y += 6;

  // 4 KPIs promedio
  const kpiW = (contentWidth - 9) / 4;
  const kpis = [
    { label: 'PESO PROMEDIO', value: `${stats.avgWeight || 0} kg`, color: pal.text },
    { label: 'SENTADILLA MEDIA', value: `${stats.avgSquat || 0} kg`, color: pal.accentText },
    { label: 'BANCA MEDIA', value: `${stats.avgBench || 0} kg`, color: pal.text },
    { label: 'SALTO CMJ MEDIO', value: `${stats.avgCMJ || 0} cm`, color: pal.amber }
  ];

  kpis.forEach((k, idx) => {
    const kx = margin + idx * (kpiW + 3);
    doc.setFillColor(...pal.cardBg);
    doc.setDrawColor(...pal.border);
    doc.roundedRect(kx, y, kpiW, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...pal.muted);
    doc.text(k.label, kx + kpiW / 2, y + 6, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...k.color);
    doc.text(pdfText(k.value), kx + kpiW / 2, y + 13.5, { align: 'center' });
  });

  y += 23;

  // Podios
  const podiumW = (contentWidth - 4) / 2;
  const topLifters = stats.topLifters || [];
  const topJumpers = stats.topJumpers || [];

  doc.setFillColor(...pal.cardBg);
  doc.setDrawColor(...pal.border);
  doc.roundedRect(margin, y, podiumW, 28, 2, 2, 'FD');
  doc.roundedRect(margin + podiumW + 4, y, podiumW, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...pal.amber);
  doc.text('TOP FUERZA RELATIVA (X BW)', margin + 4, y + 6);
  doc.text('TOP POTENCIA & SALTO CMJ', margin + podiumW + 8, y + 6);

  if (topLifters.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...pal.muted);
    doc.text('Sin marcas suficientes', margin + 4, y + 14);
  } else {
    topLifters.slice(0, 3).forEach((item, i) => {
      const ly = y + 12.5 + i * 5.2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...pal.text);
      doc.text(pdfText(`#${i + 1}  ${item.name}`).slice(0, 26), margin + 4, ly);
      doc.setTextColor(...pal.accentText);
      doc.text(`${item.ratio}x (${item.weight}kg)`, margin + podiumW - 4, ly, { align: 'right' });
    });
  }

  if (topJumpers.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...pal.muted);
    doc.text('Sin saltos registrados', margin + podiumW + 8, y + 14);
  } else {
    topJumpers.slice(0, 3).forEach((item, i) => {
      const ly = y + 12.5 + i * 5.2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...pal.text);
      doc.text(pdfText(`#${i + 1}  ${item.name}`).slice(0, 26), margin + podiumW + 8, ly);
      doc.setTextColor(...pal.amber);
      doc.text(`${item.height} cm`, 210 - margin - 4, ly, { align: 'right' });
    });
  }

  y += 34;

  // Tabla Nomina de Miembros
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...pal.text);
  doc.text('NOMINA Y DESEMPENO INDIVIDUAL DE LA CUADRILLA', margin, y);
  y += 4;

  const drawTableHeader = (currY) => {
    doc.setFillColor(...pal.cardAltBg);
    doc.roundedRect(margin, currY, contentWidth, 7.5, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...pal.muted);
    doc.text('Atleta', margin + 3, currY + 5);
    doc.text('Peso', margin + 68, currY + 5, { align: 'center' });
    doc.text('Sentad.', margin + 91, currY + 5, { align: 'center' });
    doc.text('Banca', margin + 114, currY + 5, { align: 'center' });
    doc.text('P. Muerto', margin + 137, currY + 5, { align: 'center' });
    doc.text('CMJ', margin + 158, currY + 5, { align: 'center' });
    doc.text('Ratio Rel.', 210 - margin - 3, currY + 5, { align: 'right' });
    return currY + 8.5;
  };

  y = drawTableHeader(y);

  const summaries = stats.athleteSummaries || [];
  summaries.forEach((ath, idx) => {
    if (y + 8 > 274) {
      doc.addPage();
      paintPageBackground(doc, pal);
      y = 16;
      y = drawTableHeader(y);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(...pal.cardBg);
      doc.rect(margin, y - 0.5, contentWidth, 7, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...pal.text);
    const athLabel = ath.nickname ? `${ath.name} (${ath.nickname})` : ath.name;
    doc.text(pdfText(athLabel).slice(0, 30), margin + 3, y + 4.3);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...pal.muted);
    doc.text(ath.weight ? `${ath.weight} kg` : '-', margin + 68, y + 4.3, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(ath.squat > 0 ? pal.accentText : pal.muted));
    doc.text(ath.squat > 0 ? `${ath.squat} kg` : '-', margin + 91, y + 4.3, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...pal.text);
    doc.text(ath.bench > 0 ? `${ath.bench} kg` : '-', margin + 114, y + 4.3, { align: 'center' });
    doc.text(ath.deadlift > 0 ? `${ath.deadlift} kg` : '-', margin + 137, y + 4.3, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(ath.jump > 0 ? pal.amber : pal.muted));
    doc.text(ath.jump > 0 ? `${ath.jump} cm` : '-', margin + 158, y + 4.3, { align: 'center' });

    doc.setTextColor(...(ath.relSquat > 0 ? pal.emerald : pal.muted));
    doc.text(ath.relSquat > 0 ? `${ath.relSquat}x` : '-', 210 - margin - 3, y + 4.3, { align: 'right' });

    y += 7;
  });

  // Pie de página
  const fy = Math.max(y + 8, 272);
  if (fy > 282) {
    doc.addPage();
    paintPageBackground(doc, pal);
  }
  const finalY = fy > 282 ? 270 : fy;
  doc.setDrawColor(...pal.border);
  doc.setLineWidth(0.3);
  doc.line(margin, finalY, 210 - margin, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...pal.muted);
  doc.text('Generado por Maxima Potencia Pro', margin, finalY + 5.5);
  doc.text(pdfText(`Coach a cargo: ${coachName}`), 210 - margin, finalY + 5.5, { align: 'right' });

  const sanitizedName = pdfText(group.name || 'cuadrilla')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'cuadrilla';
  doc.save(`informe_cuadrilla_${sanitizedName}_maxima_potencia.pdf`);
  return true;
};

/**
 * Fallback seguro para elementos DOM genéricos (nunca fuerza window.print automáticamente en caso de error).
 */
export const exportElementToPdf = async (element, filename = 'reporte_maxima_potencia.pdf', options = {}) => {
  if (!element) {
    throw new Error('Elemento DOM no encontrado para exportar a PDF.');
  }

  const {
    orientation = 'portrait',
    backgroundColor = '#0b0f19',
    quality = 2
  } = options;

  const canvas = await html2canvas(element, {
    scale: quality,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor,
    onclone: (clonedDoc) => {
      clonedDoc.querySelectorAll('style').forEach((styleTag) => {
        if (styleTag.textContent && styleTag.textContent.includes('oklch(')) {
          styleTag.textContent = styleTag.textContent.replace(/oklch\([^)]+\)/g, '#334155');
        }
      });
    }
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4', compress: true });
  const pdfWidth = orientation === 'portrait' ? 210 : 297;
  const pdfHeight = orientation === 'portrait' ? 297 : 210;
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  if (imgHeight <= pdfHeight) {
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
  } else {
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }
  }

  pdf.save(filename);
  return true;
};

/**
 * Comparte el PDF o reporte utilizando la Web Share API (ideal para móviles / tablets)
 */
export const shareReportNative = async ({ title, text, url }) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: title || 'Ficha de Rendimiento Máxima Potencia',
        text: text || '',
        url: url || window.location.href
      });
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Error en navigator.share:', err);
      }
      return false;
    }
  }
  return false;
};
