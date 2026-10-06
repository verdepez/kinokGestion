// Reglas Tributarias y Financieras Chilenas (2026) — Kinok Gestión
export const IVA_RATE = 0.19; // 19% IVA Débito/Crédito
export const RETENCION_BHE_2026 = 0.1525; // 15,25% Retención Boletas de Honorarios (Ley 21.133 año 2026)

export const BUDGET_CATEGORIES = [
  {
    id: 'personal_tecnico',
    label: 'Personal Técnico',
    shortLabel: 'Personal Técnico',
    description: 'Dirección, DF, Sonido Directo, Gaffer, Montaje, Color y Postproducción',
  },
  {
    id: 'equipamiento',
    label: 'Equipamiento',
    shortLabel: 'Equipamiento',
    description: 'Arriendo de cámara Cinema Line, ópticas, iluminación, grip y drones',
  },
  {
    id: 'logistica_viaticos',
    label: 'Logística/Viáticos',
    shortLabel: 'Logística/Viáticos',
    description: 'Transporte, van de producción, catering en set, alojamiento y permisos',
  },
  {
    id: 'imprevistos_contingencia',
    label: 'Imprevistos/Contingencia',
    shortLabel: 'Imprevistos/Contingencia',
    description: 'Fondo de reserva operativa, horas extra de rodaje y clima',
  },
];

export {
  PHASE_IDS,
  PROJECT_PHASES,
  PRODUCTION_TYPES,
  PRODUCTION_TYPE_LIST,
  normalizeProjectPhase,
  getPhaseMeta,
} from './scheduleEstimator.js';

/**
 * Formatea montos en Pesos Chilenos (CLP) sin decimales.
 */
export function formatCLP(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Math.round(num));
}

/**
 * Formatea montos resumidos en millones (ej: $30.4MM) o miles (ej: $218K)
 * para tarjetas de resumen compactas en mosaico.
 */
export function formatCompactCLP(amount, withSymbol = true) {
  const num = Number(amount) || 0;
  const sign = num < 0 ? '-' : '';
  const prefix = withSymbol ? '$' : '';
  const abs = Math.abs(num);

  if (abs >= 1_000_000) {
    const millions = (abs / 1_000_000).toFixed(1);
    return `${sign}${prefix}${millions}MM`;
  }
  if (abs >= 1_000) {
    const thousands = Math.round(abs / 1_000);
    return `${sign}${prefix}${thousands}K`;
  }
  return `${sign}${prefix}${Math.round(abs)}`;
}

/**
 * Formatea un porcentaje con 1 decimal (formato chileno con coma).
 */
export function formatPct(value, decimals = 1) {
  const num = Number(value) || 0;
  return `${num.toFixed(decimals).replace('.', ',')}%`;
}

/**
 * Calcula retención del 15,25% y monto líquido según tipo de documento tributario chileno (2026).
 * - Boleta de Honorarios: Retención = 15,25% sobre Monto Bruto; Líquido = Bruto - Retención.
 * - Factura: Retención honorarios = 0; Monto Neto/Bruto según corresponda.
 */
export function calculateDocumentTax(montoBruto, tipoDoc) {
  const bruto = Math.max(0, Number(montoBruto) || 0);
  if (tipoDoc === 'Boleta de Honorarios') {
    const retencion = Math.round(bruto * RETENCION_BHE_2026);
    const liquido = bruto - retencion;
    return {
      montoBruto: bruto,
      retencion,
      montoLiquido: liquido,
      ivaCredito: 0,
    };
  }
  const ivaCredito = Math.round(bruto * IVA_RATE);
  return {
    montoBruto: bruto,
    retencion: 0,
    montoLiquido: bruto,
    ivaCredito,
  };
}

/**
 * Semáforo de desviación presupuestaria:
 * - Verde (< 90%): En regla
 * - Amarillo (>= 90% y < 100%): Alerta preventiva
 * - Rojo (>= 100%): Sobrecosto
 */
export function getSemaphoreStatus(spent, budgeted) {
  const budget = Number(budgeted) || 0;
  const real = Number(spent) || 0;
  const ratio = budget > 0 ? (real / budget) * 100 : real > 0 ? 100 : 0;

  if (ratio >= 100) {
    return {
      level: 'red',
      ratio,
      label: 'Sobrecosto',
      shortLabel: 'Sobrecosto',
      badgeClass:
        'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40',
      dotClass: 'bg-rose-500',
      barClass: 'bg-rose-500',
      textClass: 'text-rose-600 dark:text-rose-400',
      borderAccent: 'border-rose-200 dark:border-rose-500/40',
    };
  }

  if (ratio >= 90) {
    return {
      level: 'yellow',
      ratio,
      label: 'Alerta (≥90%)',
      shortLabel: 'Alerta',
      badgeClass:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40',
      dotClass: 'bg-amber-500 dark:bg-amber-400',
      barClass: 'bg-amber-500 dark:bg-amber-400',
      textClass: 'text-amber-600 dark:text-amber-400',
      borderAccent: 'border-amber-200 dark:border-amber-500/40',
    };
  }

  return {
    level: 'green',
    ratio,
    label: 'En regla',
    shortLabel: 'En regla',
    badgeClass:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40',
    dotClass: 'bg-emerald-500 dark:bg-emerald-400',
    barClass: 'bg-emerald-500 dark:bg-emerald-400',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    borderAccent: 'border-slate-200 dark:border-zinc-800',
  };
}

/**
 * Calcula todos los indicadores financieros de un proyecto en tiempo real.
 */
export function computeProjectMetrics(project) {
  const budgetByCat = project.budgetCategories || {
    personal_tecnico: 0,
    equipamiento: 0,
    logistica_viaticos: 0,
    imprevistos_contingencia: 0,
  };

  const costoDirectoTotal = Object.values(budgetByCat).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0
  );

  // Margen deseado (%) aplicado sobre Costo Directo para obtener Utilidad Comercial y Precio de Venta Neto
  const margenPct = Number(project.desiredMarginPct) || 0;
  const margenUtilidad = Math.round(costoDirectoTotal * (margenPct / 100));
  const precioVentaNeto = costoDirectoTotal + margenUtilidad;
  const ivaDebito = Math.round(precioVentaNeto * IVA_RATE);
  const totalFacturable = precioVentaNeto + ivaDebito;

  // Gastos reales por partida y totales
  const realByCat = {
    personal_tecnico: 0,
    equipamiento: 0,
    logistica_viaticos: 0,
    imprevistos_contingencia: 0,
  };

  let costoRealTotal = 0;
  let totalRetencionesBHE = 0;
  let totalLiquidoPagado = 0;
  let totalIvaCreditoFacturas = 0;

  (project.expenses || []).forEach((exp) => {
    const bruto = Number(exp.montoBruto) || 0;
    const cat = exp.category in realByCat ? exp.category : 'imprevistos_contingencia';
    realByCat[cat] += bruto;
    costoRealTotal += bruto;

    const tax = calculateDocumentTax(bruto, exp.tipoDoc);
    totalRetencionesBHE += tax.retencion;
    totalLiquidoPagado += tax.montoLiquido;
    totalIvaCreditoFacturas += tax.ivaCredito;
  });

  const semaphore = getSemaphoreStatus(costoRealTotal, costoDirectoTotal);

  // Semáforos individuales por partida + Margen comercial integrado en cada enunciado
  let accumulatedMargin = 0;
  const rawCategories = BUDGET_CATEGORIES.map((cat) => {
    const budgeted = Number(budgetByCat[cat.id]) || 0;
    const spent = Number(realByCat[cat.id]) || 0;
    const variance = budgeted - spent;
    const catSemaphore = getSemaphoreStatus(spent, budgeted);
    const itemMargin = Math.round(budgeted * (margenPct / 100));
    accumulatedMargin += itemMargin;
    return {
      ...cat,
      budgeted,
      marginAmount: itemMargin,
      quotedNet: budgeted + itemMargin,
      spent,
      variance,
      semaphore: catSemaphore,
    };
  });

  // Ajuste de redondeo en el último enunciado con presupuesto para cuadrar exactamente con precioVentaNeto
  const roundingDiff = margenUtilidad - accumulatedMargin;
  const categoryBreakdown = rawCategories.map((item, idx) => {
    if (roundingDiff !== 0 && idx === rawCategories.length - 1 && costoDirectoTotal > 0) {
      return {
        ...item,
        marginAmount: item.marginAmount + roundingDiff,
        quotedNet: item.quotedNet + roundingDiff,
      };
    }
    return item;
  });

  // Margen comercial real actual (Precio Venta Neto - Costo Real Devengado)
  const utilidadRealActual = precioVentaNeto - costoRealTotal;
  const margenRealPct =
    precioVentaNeto > 0 ? (utilidadRealActual / precioVentaNeto) * 100 : 0;

  // Control de alcance (revisiones fuera de alcance)
  const outOfScopeRevisions = (project.revisions || []).filter((r) => r.outOfScope);
  const totalExtraHours = outOfScopeRevisions.reduce(
    (acc, r) => acc + (Number(r.estimatedHours) || 0),
    0
  );

  return {
    costoDirectoTotal,
    margenPct,
    margenUtilidad,
    margenComercialCLP: margenUtilidad,
    precioVentaNeto,
    ivaDebito,
    totalFacturable,
    precioVentaBruto: totalFacturable,
    costoRealTotal,
    totalRetencionesBHE,
    totalLiquidoPagado,
    totalIvaCreditoFacturas,
    utilidadRealActual,
    margenRealPct,
    semaphore,
    categoryBreakdown,
    outOfScopeCount: outOfScopeRevisions.length,
    totalExtraHours,
  };
}
