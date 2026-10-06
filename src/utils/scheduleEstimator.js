// Motor de Estimación Temporal y Fases Estandarizadas — Kinok

export const PHASE_IDS = {
  PRE_PRODUCTION: 'PRE_PRODUCTION',
  PRODUCTION: 'PRODUCTION',
  POST_PRODUCTION: 'POST_PRODUCTION',
  DELIVERY_LAUNCH: 'DELIVERY_LAUNCH',
};

export const PROJECT_PHASES = [
  {
    id: PHASE_IDS.PRE_PRODUCTION,
    label: 'Preproducción',
    shortLabel: 'Preproducción',
    description: 'Guion técnico, scouting, casting, diseño de producción y plan de rodaje',
    badgeColor:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300',
    barColor: 'bg-sky-500 dark:bg-sky-400',
    dotColor: 'bg-sky-500',
  },
  {
    id: PHASE_IDS.PRODUCTION,
    label: 'Producción / Rodaje',
    shortLabel: 'Rodaje',
    description: 'Rodaje principal en locación o estudio, captura de sonido directo y dailies',
    badgeColor:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-300',
    barColor: 'bg-violet-500 dark:bg-violet-400',
    dotColor: 'bg-violet-500',
  },
  {
    id: PHASE_IDS.POST_PRODUCTION,
    label: 'Postproducción',
    shortLabel: 'Postproducción',
    description: 'Montaje offline/online, VFX, mezcla de sonido 5.1, color grading y revisiones',
    badgeColor:
      'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300',
    barColor: 'bg-indigo-500 dark:bg-indigo-400',
    dotColor: 'bg-indigo-500',
  },
  {
    id: PHASE_IDS.DELIVERY_LAUNCH,
    label: 'Entrega / Lanzamiento',
    shortLabel: 'Entrega / Lanzamiento',
    description: 'Masterización final, entrega a cliente, distribución y agencia de lanzamiento',
    badgeColor:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300',
    barColor: 'bg-emerald-500 dark:bg-emerald-400',
    dotColor: 'bg-emerald-500',
  },
];

// Mapa de compatibilidad hacia atrás para registros antiguos en PostgreSQL o memoria
const LEGACY_PHASE_MAP = {
  Preproducción: PHASE_IDS.PRE_PRODUCTION,
  PRE_PRODUCTION: PHASE_IDS.PRE_PRODUCTION,
  Producción: PHASE_IDS.PRODUCTION,
  'Producción / Rodaje': PHASE_IDS.PRODUCTION,
  PRODUCTION: PHASE_IDS.PRODUCTION,
  Postproducción: PHASE_IDS.POST_PRODUCTION,
  POST_PRODUCTION: PHASE_IDS.POST_PRODUCTION,
  Cerrado: PHASE_IDS.DELIVERY_LAUNCH,
  CLOSED: PHASE_IDS.DELIVERY_LAUNCH,
  'Entrega / Lanzamiento': PHASE_IDS.DELIVERY_LAUNCH,
  DELIVERY_LAUNCH: PHASE_IDS.DELIVERY_LAUNCH,
};

/**
 * Normaliza cualquier identificador de fase (antiguo o nuevo) al estándar enum.
 */
export function normalizeProjectPhase(phase) {
  if (!phase) return PHASE_IDS.PRE_PRODUCTION;
  return LEGACY_PHASE_MAP[phase] || PHASE_IDS.PRE_PRODUCTION;
}

/**
 * Obtiene los metadatos visuales y semánticos de una fase.
 */
export function getPhaseMeta(phase) {
  const normalized = normalizeProjectPhase(phase);
  return (
    PROJECT_PHASES.find((p) => p.id === normalized) || PROJECT_PHASES[0]
  );
}

/**
 * Perfiles de estimación proporcional según tipo de producción audiovisual.
 */
export const PRODUCTION_TYPES = {
  video_corporativo: {
    id: 'video_corporativo',
    label: 'Comercial / Corporativo',
    subtitle: '4 a 8 semanas recomendadas',
    defaultDays: 35, // ~5 semanas
    minRecommendedTotalDays: 21,
    maxRecommendedTotalDays: 60,
    ratios: {
      pre: 0.35, // 35%
      prod: 0.1, // 10%
      post: 0.55, // 55%
    },
    minPhaseDays: {
      pre: 7,
      prod: 2,
      post: 10,
    },
    minPhasePct: {
      pre: 22,
      post: 38,
    },
  },
  cortometraje: {
    id: 'cortometraje',
    label: 'Cortometraje',
    subtitle: '2 a 4 meses recomendados',
    defaultDays: 90, // ~3 meses
    minRecommendedTotalDays: 45,
    maxRecommendedTotalDays: 135,
    ratios: {
      pre: 0.35, // 35%
      prod: 0.15, // 15%
      post: 0.5, // 50%
    },
    minPhaseDays: {
      pre: 15,
      prod: 4,
      post: 21,
    },
    minPhasePct: {
      pre: 22,
      post: 35,
    },
  },
  largometraje: {
    id: 'largometraje',
    label: 'Largometraje',
    subtitle: '1.5 a 2.5 años recomendados',
    defaultDays: 640, // ~1.75 años
    minRecommendedTotalDays: 365,
    maxRecommendedTotalDays: 950,
    ratios: {
      pre: 0.25, // 25%
      prod: 0.15, // 15%
      post: 0.6, // 60%
    },
    minPhaseDays: {
      pre: 75,
      prod: 25,
      post: 150,
    },
    minPhasePct: {
      pre: 18,
      post: 40,
    },
  },
  personalizado: {
    id: 'personalizado',
    label: 'Personalizado',
    subtitle: 'Ajuste manual de hitos',
    defaultDays: 45,
    minRecommendedTotalDays: 10,
    maxRecommendedTotalDays: 1200,
    ratios: {
      pre: 0.35,
      prod: 0.15,
      post: 0.5,
    },
    minPhaseDays: {
      pre: 5,
      prod: 1,
      post: 7,
    },
    minPhasePct: {
      pre: 18,
      post: 30,
    },
  },
};

export const PRODUCTION_TYPE_LIST = Object.values(PRODUCTION_TYPES);

/**
 * Parsea una fecha YYYY-MM-DD en UTC mediodía para evitar desfases por zona horaria.
 */
export function parseISODate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0));
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0));
  }
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/**
 * Convierte un objeto Date a string ISO YYYY-MM-DD.
 */
export function toISODate(dateObj) {
  const y = dateObj.getUTCFullYear();
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Suma `days` días a una fecha YYYY-MM-DD y retorna YYYY-MM-DD.
 */
export function addDaysISO(dateStr, days) {
  const dt = parseISODate(dateStr);
  dt.setUTCDate(dt.getUTCDate() + Math.round(days));
  return toISODate(dt);
}

/**
 * Diferencia en días calendario entre dos fechas YYYY-MM-DD (endDate - startDate).
 */
export function diffDaysISO(startDateStr, endDateStr) {
  const start = parseISODate(startDateStr);
  const end = parseISODate(endDateStr);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Formatea una fecha YYYY-MM-DD en formato corto español (ej. "06 Oct 2026").
 */
export function formatShortDateES(dateStr, includeYear = true) {
  if (!dateStr) return '—';
  const dt = parseISODate(dateStr);
  const months = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];
  const day = String(dt.getUTCDate()).padStart(2, '0');
  const mon = months[dt.getUTCMonth()];
  const year = dt.getUTCFullYear();
  return includeYear ? `${day} ${mon} ${year}` : `${day} ${mon}`;
}

/**
 * Función utilitaria pura para calcular y distribuir el cronograma entre fases
 * a partir de `startDate`, `endDate`, `projectType` y límites personalizados opcionales.
 */
export function calculatePhaseSchedule({
  startDate,
  endDate,
  projectType = 'video_corporativo',
  customBoundaries = null,
  referenceDate = null,
}) {
  const profile = PRODUCTION_TYPES[projectType] || PRODUCTION_TYPES.video_corporativo;
  const safeStart = startDate || '2026-10-06';
  let safeEnd = endDate || addDaysISO(safeStart, profile.defaultDays);

  // Garantizar al menos 3 días de proyecto para repartir Pre, Rodaje y Post
  let totalDays = diffDaysISO(safeStart, safeEnd);
  if (totalDays < 3) {
    safeEnd = addDaysISO(safeStart, 3);
    totalDays = 3;
  }

  let preDays;
  let prodDays;
  let postDays;

  if (
    customBoundaries &&
    customBoundaries.preEndDate &&
    customBoundaries.prodEndDate
  ) {
    // Calcular días a partir de los hitos ajustados manualmente por el usuario
    const rawPreDays = diffDaysISO(safeStart, customBoundaries.preEndDate);
    preDays = Math.min(Math.max(1, rawPreDays), totalDays - 2);

    const actualPreEnd = addDaysISO(safeStart, preDays);
    const rawProdDays = diffDaysISO(actualPreEnd, customBoundaries.prodEndDate);
    prodDays = Math.min(Math.max(1, rawProdDays), totalDays - preDays - 1);

    postDays = Math.max(1, totalDays - preDays - prodDays);
  } else {
    // Distribución proporcional sugerida según el tipo de producción
    preDays = Math.max(1, Math.round(totalDays * profile.ratios.pre));
    prodDays = Math.max(1, Math.round(totalDays * profile.ratios.prod));
    if (preDays + prodDays >= totalDays) {
      preDays = Math.max(1, totalDays - 2);
      prodDays = 1;
    }
    postDays = Math.max(1, totalDays - preDays - prodDays);
  }

  const preStartDate = safeStart;
  const preEndDate = addDaysISO(preStartDate, preDays);

  const prodStartDate = preEndDate;
  const prodEndDate = addDaysISO(prodStartDate, prodDays);

  const postStartDate = prodEndDate;
  const postEndDate = safeEnd;

  const prePct = Math.round((preDays / totalDays) * 100);
  const prodPct = Math.round((prodDays / totalDays) * 100);
  const postPct = Math.max(1, 100 - prePct - prodPct);

  // Determinar fase actual automáticamente según fecha de referencia (o fecha del sistema)
  const refISO = referenceDate || toISODate(new Date());
  let inferredPhase = PHASE_IDS.PRE_PRODUCTION;
  if (refISO >= postEndDate) {
    inferredPhase = PHASE_IDS.DELIVERY_LAUNCH;
  } else if (refISO >= postStartDate) {
    inferredPhase = PHASE_IDS.POST_PRODUCTION;
  } else if (refISO >= prodStartDate) {
    inferredPhase = PHASE_IDS.PRODUCTION;
  } else {
    inferredPhase = PHASE_IDS.PRE_PRODUCTION;
  }

  const daysRemaining =
    refISO >= postEndDate ? 0 : diffDaysISO(refISO < safeStart ? safeStart : refISO, postEndDate);

  const phases = [
    {
      id: PHASE_IDS.PRE_PRODUCTION,
      label: 'Preproducción',
      shortLabel: 'Pre',
      startDate: preStartDate,
      endDate: preEndDate,
      days: preDays,
      percentage: prePct,
    },
    {
      id: PHASE_IDS.PRODUCTION,
      label: 'Producción / Rodaje',
      shortLabel: 'Rodaje',
      startDate: prodStartDate,
      endDate: prodEndDate,
      days: prodDays,
      percentage: prodPct,
    },
    {
      id: PHASE_IDS.POST_PRODUCTION,
      label: 'Postproducción',
      shortLabel: 'Post',
      startDate: postStartDate,
      endDate: postEndDate,
      days: postDays,
      percentage: postPct,
    },
    {
      id: PHASE_IDS.DELIVERY_LAUNCH,
      label: 'Entrega / Lanzamiento',
      shortLabel: 'Lanzamiento',
      startDate: postEndDate,
      endDate: postEndDate,
      days: 1,
      percentage: 0,
      isMilestone: true,
    },
  ];

  const shootDatesLabel = `${formatShortDateES(safeStart, false)} – ${formatShortDateES(
    safeEnd,
    true
  )}`;

  const warnings = evaluateScheduleWarnings(
    {
      totalDays,
      preDays,
      prodDays,
      postDays,
      prePct,
      prodPct,
      postPct,
    },
    projectType
  );

  return {
    projectType,
    typeLabel: profile.label,
    startDate: safeStart,
    endDate: safeEnd,
    totalDays,
    preEndDate,
    prodEndDate,
    phases,
    inferredPhase,
    daysRemaining,
    shootDatesLabel,
    warnings,
  };
}

/**
 * Evalúa si los tiempos de Preproducción, Rodaje o Postproducción son críticamente cortos
 * respecto al estándar de la industria para ese tipo de producción.
 */
export function evaluateScheduleWarnings(metrics, projectType = 'video_corporativo') {
  const profile = PRODUCTION_TYPES[projectType] || PRODUCTION_TYPES.video_corporativo;
  const alerts = [];

  if (metrics.totalDays < profile.minRecommendedTotalDays) {
    alerts.push({
      id: 'total-short',
      phaseId: 'GLOBAL',
      severity: 'warning',
      title: 'Duración total comprimida',
      message: `Un proyecto "${profile.label}" suele requerir al menos ${profile.minRecommendedTotalDays} días (${profile.subtitle}). Actualmente tiene ${metrics.totalDays} días.`,
    });
  }

  if (
    metrics.preDays < profile.minPhaseDays.pre ||
    metrics.prePct < profile.minPhasePct.pre
  ) {
    alerts.push({
      id: 'pre-critical',
      phaseId: PHASE_IDS.PRE_PRODUCTION,
      severity: 'critical',
      title: 'Preproducción críticamente corta',
      message: `Solo ${metrics.preDays} días (${metrics.prePct}%) para Preproducción. El estándar mínimo para ${profile.label} es ${profile.minPhaseDays.pre} días (~${Math.round(
        profile.ratios.pre * 100
      )}%) para asegurar scouting, casting y guion técnico.`,
    });
  }

  if (
    metrics.postDays < profile.minPhaseDays.post ||
    metrics.postPct < profile.minPhasePct.post
  ) {
    alerts.push({
      id: 'post-critical',
      phaseId: PHASE_IDS.POST_PRODUCTION,
      severity: 'critical',
      title: 'Postproducción con alto riesgo de cuello de botella',
      message: `Solo ${metrics.postDays} días (${metrics.postPct}%) para Postproducción. El estándar mínimo para ${profile.label} es ${profile.minPhaseDays.post} días (~${Math.round(
        profile.ratios.post * 100
      )}%) para edición, color, sonido y rondas de revisión.`,
    });
  }

  if (metrics.prodDays < profile.minPhaseDays.prod) {
    alerts.push({
      id: 'prod-short',
      phaseId: PHASE_IDS.PRODUCTION,
      severity: 'warning',
      title: 'Ventana de rodaje muy ajustada',
      message: `Se asignaron ${metrics.prodDays} día(s) de rodaje (recomendado mínimo ${profile.minPhaseDays.prod} días para ${profile.label}).`,
    });
  }

  return alerts;
}

