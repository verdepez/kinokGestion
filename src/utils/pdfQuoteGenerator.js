// Generador de Cotización en PDF (A4 Nativo) y Enlaces para WhatsApp / Email — Kinok

import {
  PRODUCTION_TYPES,
  PHASE_IDS,
  calculatePhaseSchedule,
  formatShortDateES,
} from './scheduleEstimator.js';
import { computeProjectMetrics, formatCLP } from './finance.js';

/**
 * Convierte texto UTF-8 a octetos WinAnsi (Windows-1252 / Latin-1) escapados para PDF.
 */
function pdfEscapeWinAnsi(str = '') {
  const clean = String(str)
    .replace(/→/g, '->')
    .replace(/·/g, '-')
    .replace(/«/g, '"')
    .replace(/»/g, '"')
    .replace(/—/g, '-')
    .replace(/–/g, '-');

  let out = '';
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    if (code === 40 || code === 41 || code === 92) {
      // '(', ')', '\'
      out += '\\' + clean[i];
    } else if (code >= 32 && code <= 126) {
      out += clean[i];
    } else if (code >= 160 && code <= 255) {
      out += '\\' + code.toString(8).padStart(3, '0');
    } else {
      out += '?';
    }
  }
  return out;
}

/**
 * Construye un archivo binario PDF 1.4 válido de 1 página A4 (595 x 842 pt)
 * con diseño corporativo de Kinok Producciones Audiovisuales.
 */
export function generateQuotePdfBlob(projectData) {
  const metrics = computeProjectMetrics(projectData);
  const prodType =
    PRODUCTION_TYPES[projectData.projectType] ||
    PRODUCTION_TYPES.video_corporativo;
  const schedule =
    projectData.phaseSchedule && Array.isArray(projectData.phaseSchedule.phases)
      ? projectData.phaseSchedule
      : calculatePhaseSchedule({
          startDate: projectData.startDate || '2026-10-06',
          endDate: projectData.endDate || '2026-11-10',
          projectType: projectData.projectType || 'video_corporativo',
        });

  const prePhase =
    schedule.phases.find((p) => p.id === PHASE_IDS.PRE_PRODUCTION) || {};
  const prodPhase =
    schedule.phases.find((p) => p.id === PHASE_IDS.PRODUCTION) || {};
  const postPhase =
    schedule.phases.find((p) => p.id === PHASE_IDS.POST_PRODUCTION) || {};

  const code = projectData.code || 'COT-2026';
  const issueDate = formatShortDateES(new Date().toISOString().slice(0, 10));
  const cats = projectData.budgetCategories || {};

  const ops = [];

  const rectFill = (x, y, w, h, r, g, b) => {
    ops.push(`${r} ${g} ${b} rg ${x} ${y} ${w} ${h} re f`);
  };

  const rectStroke = (x, y, w, h, r, g, b, lw = 1) => {
    ops.push(`${lw} w ${r} ${g} ${b} RG ${x} ${y} ${w} ${h} re S`);
  };

  const text = (x, y, size, font, str, r = 0.06, g = 0.09, b = 0.16) => {
    ops.push(
      `BT /${font} ${size} Tf ${r} ${g} ${b} rg ${x} ${y} Td (${pdfEscapeWinAnsi(
        str
      )}) Tj ET`
    );
  };

  // Fondo superior corporativo (Emerald / Slate)
  rectFill(0, 750, 595, 92, 0.04, 0.29, 0.22);
  text(40, 805, 18, 'F2', 'KINOK PRODUCCIONES AUDIOVISUALES', 1, 1, 1);
  text(
    40,
    785,
    10,
    'F1',
    'Cotizacion Comercial y Cronograma Estimado de Produccion',
    0.82,
    0.98,
    0.9
  );
  text(40, 767, 9, 'F1', 'Santiago de Chile - Regimen Tributario SII 2026', 0.7, 0.9, 0.82);

  // Recuadro de Folio a la derecha
  rectFill(415, 764, 140, 58, 0.02, 0.2, 0.15);
  text(427, 804, 9, 'F2', `FOLIO: ${code}`, 0.65, 0.95, 0.83);
  text(427, 789, 8.5, 'F1', `Emision: ${issueDate}`, 0.9, 0.96, 0.93);
  text(
    427,
    774,
    8.5,
    'F1',
    `Validez: ${projectData.quoteValidityDays || 15} dias corridos`,
    0.9,
    0.96,
    0.93
  );

  // SECCIÓN 1: IDENTIFICACIÓN DEL PROYECTO Y CLIENTE
  text(40, 722, 11, 'F2', '1. IDENTIFICACION DEL PROYECTO Y CLIENTE', 0.05, 0.35, 0.26);
  rectFill(40, 632, 515, 82, 0.96, 0.98, 0.97);
  rectStroke(40, 632, 515, 82, 0.82, 0.88, 0.85, 0.8);

  text(52, 695, 9, 'F2', 'Proyecto:', 0.3, 0.35, 0.4);
  text(135, 695, 9.5, 'F2', projectData.name || 'Proyecto Audiovisual');

  text(52, 677, 9, 'F2', 'Cliente / Marca:', 0.3, 0.35, 0.4);
  text(135, 677, 9.5, 'F1', projectData.client || 'Por definir');

  text(52, 659, 9, 'F2', 'Tipo Produccion:', 0.3, 0.35, 0.4);
  text(135, 659, 9.5, 'F1', `${prodType.label} (${schedule.totalDays} dias calendario)`);

  text(52, 641, 9, 'F2', 'Locacion / Partner:', 0.3, 0.35, 0.4);
  text(
    135,
    641,
    9,
    'F1',
    `${projectData.shootLocation || 'Santiago, RM'}${
      projectData.distributionPartner
        ? ` | Partner: ${projectData.distributionPartner}`
        : ''
    }`
  );

  if (projectData.clientContact) {
    text(340, 677, 8.5, 'F2', 'Contacto:', 0.3, 0.35, 0.4);
    text(390, 677, 8.5, 'F1', projectData.clientContact);
  }

  // SECCIÓN 2: CRONOGRAMA ESTIMADO Y FECHA DE ENTREGA / LANZAMIENTO
  text(
    40,
    604,
    11,
    'F2',
    '2. CRONOGRAMA DE FASES Y FECHA DE ENTREGA / LANZAMIENTO',
    0.05,
    0.35,
    0.26
  );

  // Resumen de rango
  rectFill(40, 572, 515, 24, 0.91, 0.96, 0.94);
  text(
    52,
    581,
    9.5,
    'F2',
    `Inicio Preproduccion: ${formatShortDateES(schedule.startDate)}   ->   Entrega / Lanzamiento: ${formatShortDateES(
      schedule.endDate
    )} (${schedule.totalDays} dias)`,
    0.04,
    0.3,
    0.22
  );

  // Tabla de fases
  const phaseRows = [
    {
      name: 'Fase 1: Preproduccion (Guion, Scouting, Casting)',
      dates: `${formatShortDateES(prePhase.startDate)} al ${formatShortDateES(prePhase.endDate)}`,
      duration: `${prePhase.days || 0} dias (${prePhase.percentage || 0}%)`,
    },
    {
      name: 'Fase 2: Produccion / Rodaje Principal',
      dates: `${formatShortDateES(prodPhase.startDate)} al ${formatShortDateES(
        prodPhase.endDate
      )}`,
      duration: `${prodPhase.days || 0} dias (${prodPhase.percentage || 0}%)`,
    },
    {
      name: 'Fase 3: Postproduccion (Montaje, Color, Sonido)',
      dates: `${formatShortDateES(postPhase.startDate)} al ${formatShortDateES(
        postPhase.endDate
      )}`,
      duration: `${postPhase.days || 0} dias (${postPhase.percentage || 0}%)`,
    },
    {
      name: 'Fase 4: Hito de Entrega / Lanzamiento Final',
      dates: formatShortDateES(schedule.endDate),
      duration: projectData.distributionPartner
        ? `Partner: ${projectData.distributionPartner.slice(0, 28)}`
        : 'Master Final Cliente',
    },
  ];

  let yPhase = 550;
  phaseRows.forEach((row, idx) => {
    if (idx % 2 === 0) {
      rectFill(40, yPhase - 6, 515, 20, 0.97, 0.98, 0.99);
    }
    rectStroke(40, yPhase - 6, 515, 20, 0.88, 0.9, 0.92, 0.5);
    text(50, yPhase, 8.5, 'F2', row.name);
    text(295, yPhase, 8.5, 'F1', row.dates, 0.25, 0.3, 0.38);
    text(435, yPhase, 8.5, 'F2', row.duration, 0.05, 0.35, 0.26);
    yPhase -= 20;
  });

  // SECCIÓN 3: PRESUPUESTO Y DESGLOSE COMERCIAL ($ CLP) CON MARGEN INTEGRADO EN CADA ENUNCIADO
  text(40, 448, 11, 'F2', '3. DESGLOSE DE PARTIDAS Y PROPUESTA ECONOMICA (CLP)', 0.05, 0.35, 0.26);

  const catMap = {};
  (metrics.categoryBreakdown || []).forEach((c) => {
    catMap[c.id] = c.quotedNet;
  });

  const budgetRows = [
    {
      label: '1. Personal Tecnico, Direccion y Equipo de Realizacion (Pre, Rodaje y Post)',
      amount: formatCLP(catMap.personal_tecnico || 0),
    },
    {
      label: '2. Equipamiento Cinematografico (Camara, Opticas, Iluminacion y Sonido)',
      amount: formatCLP(catMap.equipamiento || 0),
    },
    {
      label: '3. Logistica Operativa, Transporte, Locaciones y Viaticos de Produccion',
      amount: formatCLP(catMap.logistica_viaticos || 0),
    },
    {
      label: '4. Reserva Operativa, Imprevistos de Set y Contingencia Tecnica',
      amount: formatCLP(catMap.imprevistos_contingencia || 0),
    },
  ];

  let yBudget = 420;
  budgetRows.forEach((item, idx) => {
    if (idx % 2 === 0) {
      rectFill(40, yBudget - 7, 515, 24, 0.97, 0.98, 0.99);
    }
    rectStroke(40, yBudget - 7, 515, 24, 0.88, 0.9, 0.92, 0.5);
    text(50, yBudget, 8.5, 'F1', item.label);
    text(455, yBudget, 9, 'F2', item.amount);
    yBudget -= 24;
  });

  // Caja de Totales (Subtotal Neto Partidas, IVA 19%, Total Bruto)
  rectFill(280, 225, 275, 76, 0.95, 0.98, 0.96);
  rectStroke(280, 225, 275, 76, 0.1, 0.55, 0.4, 1);

  text(295, 278, 9.5, 'F2', 'VALOR NETO COTIZACION:');
  text(455, 278, 9.5, 'F2', formatCLP(metrics.precioVentaNeto));

  text(295, 256, 9, 'F1', 'IVA Debito Fiscal (19% SII):', 0.3, 0.35, 0.4);
  text(455, 256, 9, 'F1', formatCLP(metrics.ivaDebito));

  rectFill(280, 225, 275, 22, 0.04, 0.29, 0.22);
  text(295, 232, 10, 'F2', 'TOTAL PROPUESTA (CON IVA):', 1, 1, 1);
  text(455, 232, 10.5, 'F2', formatCLP(metrics.precioVentaBruto), 0.75, 0.98, 0.88);

  // Notas y condiciones comerciales a la izquierda de los totales
  text(40, 292, 9.5, 'F2', 'Condiciones Comerciales:', 0.15, 0.2, 0.28);
  text(40, 276, 8, 'F1', '- Forma de pago sugerida: 50% anticipo al confirmar', 0.3, 0.35, 0.4);
  text(40, 264, 8, 'F1', '  presupuesto y 50% contra entrega de Master Final.', 0.3, 0.35, 0.4);
  text(40, 250, 8, 'F1', '- Incluye 2 rondas de revision en postproduccion.', 0.3, 0.35, 0.4);
  if (projectData.quoteNotes) {
    text(
      40,
      234,
      8,
      'F2',
      `Nota: ${String(projectData.quoteNotes).slice(0, 46)}`,
      0.05,
      0.35,
      0.26
    );
  }

  // Pie de firma y confirmación
  rectStroke(40, 125, 515, 72, 0.82, 0.85, 0.88, 0.8);
  text(
    52,
    176,
    9,
    'F2',
    'ACEPTACION Y ACTIVACION DE FLUJO DE TRABAJO',
    0.1,
    0.15,
    0.22
  );
  text(
    52,
    160,
    8,
    'F1',
    'Una vez aprobado este presupuesto por el cliente, la direccion confirma la cotizacion en la',
    0.35,
    0.4,
    0.45
  );
  text(
    52,
    148,
    8,
    'F1',
    'plataforma Kinok para activar automaticamente las tareas en el tablero de Preproduccion.',
    0.35,
    0.4,
    0.45
  );
  text(
    52,
    133,
    8,
    'F2',
    'Emitido por: Nicolas Iriarte (Director Ejecutivo - Kinok Producciones)',
    0.05,
    0.35,
    0.26
  );

  const streamContent = ops.join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n',
    `6 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += objects[i];
  }

  const startXref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

/**
 * Descarga directamente el archivo .pdf de la cotización en el dispositivo del usuario.
 */
export function downloadQuotePdf(projectData) {
  const blob = generateQuotePdfBlob(projectData);
  const url = URL.createObjectURL(blob);
  const safeName = String(projectData.name || 'Proyecto')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_');
  const code = projectData.code || 'COT';
  const filename = `Cotizacion_Kinok_${code}_${safeName}.pdf`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return filename;
}

/**
 * Genera el mensaje estructurado para compartir la cotización por WhatsApp.
 */
export function buildWhatsAppQuoteUrl(projectData) {
  const metrics = computeProjectMetrics(projectData);
  const prodType =
    PRODUCTION_TYPES[projectData.projectType] ||
    PRODUCTION_TYPES.video_corporativo;
  const schedule =
    projectData.phaseSchedule && Array.isArray(projectData.phaseSchedule.phases)
      ? projectData.phaseSchedule
      : calculatePhaseSchedule({
          startDate: projectData.startDate || '2026-10-06',
          endDate: projectData.endDate || '2026-11-10',
          projectType: projectData.projectType || 'video_corporativo',
        });

  const itemLines = (metrics.categoryBreakdown || []).map(
    (c) => `  - ${c.label}: ${formatCLP(c.quotedNet)}`
  );

  const message = [
    `*COTIZACIÓN KINOK PRODUCCIONES (${projectData.code || 'COT-2026'})*`,
    `Hola *${projectData.client}*, te compartimos el resumen de cotización y cronograma para el proyecto *${projectData.name}*:`,
    ``,
    `• *Tipo de Producción:* ${prodType.label}`,
    `• *Inicio Preproducción:* ${formatShortDateES(schedule.startDate)}`,
    `• *Entrega / Lanzamiento:* ${formatShortDateES(schedule.endDate)} (${schedule.totalDays} días)`,
    projectData.distributionPartner
      ? `• *Partner de Lanzamiento:* ${projectData.distributionPartner}`
      : null,
    ``,
    `*DESGLOSE DE PARTIDAS (VALOR NETO):*`,
    ...itemLines,
    ``,
    `*RESUMEN ECONÓMICO (CLP):*`,
    `• Subtotal Neto: *${formatCLP(metrics.precioVentaNeto)}*`,
    `• IVA (19%): ${formatCLP(metrics.ivaDebito)}`,
    `• *Total con IVA: ${formatCLP(metrics.precioVentaBruto)}*`,
    ``,
    `Adjuntamos el documento PDF con el detalle de la propuesta. Quedamos atentos a su confirmación para activar el flujo de preproducción.`,
  ]
    .filter((line) => line !== null)
    .join('\n');

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Genera el enlace mailto: listo para enviar la cotización por correo electrónico.
 */
export function buildMailtoQuoteUrl(projectData) {
  const metrics = computeProjectMetrics(projectData);
  const prodType =
    PRODUCTION_TYPES[projectData.projectType] ||
    PRODUCTION_TYPES.video_corporativo;
  const schedule =
    projectData.phaseSchedule && Array.isArray(projectData.phaseSchedule.phases)
      ? projectData.phaseSchedule
      : calculatePhaseSchedule({
          startDate: projectData.startDate || '2026-10-06',
          endDate: projectData.endDate || '2026-11-10',
          projectType: projectData.projectType || 'video_corporativo',
        });

  const itemLines = (metrics.categoryBreakdown || []).map(
    (c) => `- ${c.label}: ${formatCLP(c.quotedNet)}`
  );

  const subject = `Cotización Audiovisual Kinok (${projectData.code || 'COT-2026'}) - ${
    projectData.name
  }`;
  const body = [
    `Estimados ${projectData.client},`,
    ``,
    `Junto con saludar, enviamos la cotización formal y planificación de fechas para el proyecto "${projectData.name}".`,
    ``,
    `1. CRONOGRAMA ESTIMADO (${prodType.label} - ${schedule.totalDays} días):`,
    `- Inicio Preproducción: ${formatShortDateES(schedule.startDate)}`,
    `- Fin Preproducción: ${formatShortDateES(schedule.preEndDate)}`,
    `- Fin Producción / Rodaje: ${formatShortDateES(schedule.prodEndDate)}`,
    `- Entrega / Lanzamiento Final: ${formatShortDateES(schedule.endDate)}`,
    projectData.distributionPartner
      ? `- Partner de Distribución / Agencia: ${projectData.distributionPartner}`
      : null,
    ``,
    `2. DESGLOSE DE PARTIDAS (VALORES NETOS CLP):`,
    ...itemLines,
    ``,
    `3. TOTALES PROPUESTA (CLP):`,
    `- Valor Neto Propuesta: ${formatCLP(metrics.precioVentaNeto)}`,
    `- IVA (19%): ${formatCLP(metrics.ivaDebito)}`,
    `- TOTAL CON IVA: ${formatCLP(metrics.precioVentaBruto)}`,
    ``,
    `(Se adjunta el PDF detallado "${
      projectData.code || 'COT'
    }" descargado desde Kinok Gestión).`,
    ``,
    `Atentamente,`,
    `Nicolás Iriarte`,
    `Director Ejecutivo — Kinok Producciones`,
  ]
    .filter((line) => line !== null)
    .join('\n');

  const emailTo =
    projectData.clientContact && projectData.clientContact.includes('@')
      ? projectData.clientContact.trim()
      : '';

  return `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

