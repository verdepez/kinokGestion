import React, { useState, useRef, useEffect } from 'react';
import {
  Clapperboard,
  TrendingUp,
  Landmark,
  AlertTriangle,
  Clock,
  ArrowRight,
  Plus,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Share2,
  Calendar,
  CheckCircle2,
  ChevronsUpDown,
  FileDown,
  Send,
  Mail,
  FileText,
  X,
  ArrowDown,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import {
  PROJECT_PHASES,
  PHASE_IDS,
  PRODUCTION_TYPES,
  normalizeProjectPhase,
  getPhaseMeta,
  computeProjectMetrics,
  formatCLP,
  formatCompactCLP,
  formatPct,
} from '../utils/finance';
import {
  downloadQuotePdf,
  buildWhatsAppQuoteUrl,
  buildMailtoQuoteUrl,
} from '../utils/pdfQuoteGenerator';
import ScheduleEstimatorModal from './ScheduleEstimatorModal';
import NativeModal from './NativeModal';

export default function DirectorDashboard({
  projects,
  onSelectProject,
  onMoveProjectPhase,
  onCreateProject,
  onConfirmQuote,
  lastPhaseTransition,
  onClearPhaseTransition,
}) {
  const [semaphoreFilter, setSemaphoreFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // Apartado de Finanzas desplegable al hacer tap en las tarjetas financieras ('cashflow' | 'f29' | 'budget' | null)
  const [activeFinancePanel, setActiveFinancePanel] = useState(null);
  const financeSectionRef = useRef(null);
  const accordionsContainerRef = useRef(null);

  // Estado de acordeón desplegable por fase para vista mobile (< lg):
  // Preproducción desplegada por defecto y el resto agrupado para fácil acceso sin scroll largo
  const [openPhases, setOpenPhases] = useState(() => ({
    [PHASE_IDS.PRE_PRODUCTION]: true,
    [PHASE_IDS.PRODUCTION]: false,
    [PHASE_IDS.POST_PRODUCTION]: false,
    [PHASE_IDS.DELIVERY_LAUNCH]: false,
  }));

  // Confirmación visual cuando un proyecto pasa de un grupo a otro
  const [phaseTransitionFeedback, setPhaseTransitionFeedback] = useState(
    lastPhaseTransition || null
  );
  const phaseSectionRefs = useRef({});

  // Si la transición ocurrió en la vista de detalle o en el tablero, abrir el grupo destino automáticamente
  useEffect(() => {
    if (lastPhaseTransition && lastPhaseTransition.toPhaseId) {
      setPhaseTransitionFeedback(lastPhaseTransition);
      setOpenPhases((prev) => ({
        ...prev,
        [lastPhaseTransition.toPhaseId]: true,
      }));
    }
  }, [lastPhaseTransition]);

  const togglePhaseAccordion = (phaseId) => {
    setOpenPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  const visiblePhases =
    phaseFilter === 'all'
      ? PROJECT_PHASES
      : PROJECT_PHASES.filter((ph) => ph.id === phaseFilter);

  const allExpanded = visiblePhases.every((ph) => openPhases[ph.id]);

  const handleToggleAllAccordions = () => {
    const nextState = !allExpanded;
    const updated = { ...openPhases };
    visiblePhases.forEach((ph) => {
      updated[ph.id] = nextState;
    });
    setOpenPhases(updated);
  };

  const handleFocusPhaseMobile = (phaseId) => {
    setPhaseFilter('all');
    setOpenPhases((prev) => ({
      ...prev,
      [phaseId]: true,
    }));
    setTimeout(() => {
      const el = phaseSectionRefs.current[phaseId];
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleSelectPhaseFilter = (nextPhaseId) => {
    setPhaseFilter(nextPhaseId);
    if (nextPhaseId !== 'all') {
      setOpenPhases((prev) => ({
        ...prev,
        [nextPhaseId]: true,
      }));
    }
  };

  const handleResetFilters = () => {
    setSemaphoreFilter('all');
    setPhaseFilter('all');
  };

  // Al hacer tap en "En Ejecución Activa", moverse hasta el apartado de los acordeones
  const handleTapActiveExecutionCard = () => {
    setTimeout(() => {
      if (
        accordionsContainerRef.current &&
        typeof accordionsContainerRef.current.scrollIntoView === 'function'
      ) {
        accordionsContainerRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 40);
  };

  // Al hacer tap en una tarjeta financiera, desplegar/alternar su detalle en el apartado de finanzas
  const handleTapFinanceCard = (panelKey) => {
    setActiveFinancePanel((prev) => {
      const next = prev === panelKey ? null : panelKey;
      if (next) {
        setTimeout(() => {
          if (
            financeSectionRef.current &&
            typeof financeSectionRef.current.scrollIntoView === 'function'
          ) {
            financeSectionRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
            });
          }
        }, 60);
      }
      return next;
    });
  };

  // Cambiar de fase garantizando el traspaso de grupo y apertura del acordeón destino
  const handleMovePhaseWithConfirmation = (project, targetPhaseId) => {
    const currentNormalized = normalizeProjectPhase(project.phase);
    const nextNormalized = normalizeProjectPhase(targetPhaseId);
    if (currentNormalized === nextNormalized) return;

    const fromMeta = getPhaseMeta(currentNormalized);
    const toMeta = getPhaseMeta(nextNormalized);

    // 1. Ejecutar actualización de estado real en App y backend
    onMoveProjectPhase(project.id, nextNormalized);

    // 2. Asegurar que el acordeón del grupo destino esté abierto en mobile
    setOpenPhases((prev) => ({
      ...prev,
      [nextNormalized]: true,
    }));

    // 3. Mostrar confirmación de traspaso entre grupos
    setPhaseTransitionFeedback({
      projectId: project.id,
      projectName: project.name,
      fromPhaseId: currentNormalized,
      fromLabel: fromMeta.label,
      toPhaseId: nextNormalized,
      toLabel: toMeta.label,
    });
  };

  const handleDismissFeedback = () => {
    setPhaseTransitionFeedback(null);
    if (typeof onClearPhaseTransition === 'function') {
      onClearPhaseTransition();
    }
  };

  const handleCreateProjectWithAccordion = (formData) => {
    const targetPhase = normalizeProjectPhase(formData.phase);
    const created = onCreateProject(formData);
    setOpenPhases((prev) => ({
      ...prev,
      [targetPhase]: true,
    }));
    return created;
  };

  const handleConfirmQuoteAndActivate = (project) => {
    const targetPhase = normalizeProjectPhase(project.phase);
    const toMeta = getPhaseMeta(targetPhase);
    if (typeof onConfirmQuote === 'function') {
      onConfirmQuote(project.id);
    }
    setOpenPhases((prev) => ({
      ...prev,
      [targetPhase]: true,
    }));
    setPhaseTransitionFeedback({
      projectId: project.id,
      projectName: project.name,
      fromPhaseId: 'QUOTE',
      fromLabel: 'Cotización Confirmada',
      toPhaseId: targetPhase,
      toLabel: toMeta.label,
    });
  };

  const enrichedProjects = projects.map((project) => ({
    ...project,
    normalizedPhase: normalizeProjectPhase(project.phase),
    metrics: computeProjectMetrics(project),
  }));

  // Separar cotizaciones pendientes de confirmación vs proyectos activos en flujos de trabajo
  const pendingQuoteProjects = enrichedProjects.filter(
    (p) => p.quoteStatus === 'PENDING_APPROVAL'
  );
  const workflowProjects = enrichedProjects.filter(
    (p) => p.quoteStatus !== 'PENDING_APPROVAL'
  );

  const activeProjects = workflowProjects.filter(
    (p) => p.normalizedPhase !== PHASE_IDS.DELIVERY_LAUNCH
  );
  const boutiqueCapacity = 5;

  const totals = workflowProjects.reduce(
    (acc, item) => {
      const m = item.metrics;
      acc.costoDirectoPresupuestado += m.costoDirectoTotal;
      acc.costoRealDevengado += m.costoRealTotal;
      acc.precioVentaNeto += m.precioVentaNeto;
      acc.ivaDebito += m.ivaDebito;
      acc.retencionesBHE1525 += m.totalRetencionesBHE;
      acc.ivaCreditoFacturas += m.totalIvaCreditoFacturas;

      if (m.semaphore.level === 'red') acc.redCount += 1;
      else if (m.semaphore.level === 'yellow') acc.yellowCount += 1;
      else acc.greenCount += 1;

      return acc;
    },
    {
      costoDirectoPresupuestado: 0,
      costoRealDevengado: 0,
      precioVentaNeto: 0,
      ivaDebito: 0,
      retencionesBHE1525: 0,
      ivaCreditoFacturas: 0,
      redCount: 0,
      yellowCount: 0,
      greenCount: 0,
    }
  );

  const flujoCajaProyectado = totals.precioVentaNeto - totals.costoRealDevengado;
  const f29ObligacionDirecta = totals.ivaDebito + totals.retencionesBHE1525;
  const presupuestoEjecutadoPct =
    (totals.costoRealDevengado / (totals.costoDirectoPresupuestado || 1)) * 100;

  // Filtrado por estado presupuestario (semáforo)
  const statusFilteredProjects = workflowProjects.filter((p) => {
    if (semaphoreFilter === 'all') return true;
    return p.metrics.semaphore.level === semaphoreFilter;
  });

  // Filtrado combinado (estado + fase)
  const filteredProjects = statusFilteredProjects.filter((p) => {
    if (phaseFilter === 'all') return true;
    return p.normalizedPhase === phaseFilter;
  });

  const activeFiltersCount =
    (semaphoreFilter !== 'all' ? 1 : 0) + (phaseFilter !== 'all' ? 1 : 0);

  const SEMAPHORE_OPTIONS = [
    {
      id: 'all',
      label: 'Todos los estados',
      shortLabel: 'Todos',
      count: workflowProjects.length,
      dotClass: 'bg-slate-400',
    },
    {
      id: 'green',
      label: 'En regla',
      shortLabel: 'En regla',
      count: totals.greenCount,
      dotClass: 'bg-emerald-500',
    },
    {
      id: 'yellow',
      label: 'En alerta',
      shortLabel: 'Alerta',
      count: totals.yellowCount,
      dotClass: 'bg-amber-500',
    },
    {
      id: 'red',
      label: 'Sobrecosto',
      shortLabel: 'Sobrecosto',
      count: totals.redCount,
      dotClass: 'bg-rose-500',
    },
  ];

  const activeSemaphoreOption =
    SEMAPHORE_OPTIONS.find((opt) => opt.id === semaphoreFilter) || SEMAPHORE_OPTIONS[0];
  const activePhaseMeta =
    phaseFilter === 'all' ? null : getPhaseMeta(phaseFilter);

  const phaseOrder = PROJECT_PHASES.map((p) => p.id);

  return (
    <div className="space-y-6">
      {/* Encabezado limpio (los filtros de proyecto se ubicaron junto a los grupos por fase) */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Panel de Proyectos
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          Ciclo de vida estandarizado (Preproducción → Rodaje → Postproducción → Entrega / Lanzamiento)
        </p>
      </div>

      {/* Mosaico de 4 Cajas de Resumen (2x2 en Mobile, 4 en Desktop) con números compactos MM / K e interacción por Tap */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
        {/* KPI 1: En Ejecución Activa -> Al hacer tap baja hasta el apartado de los acordeones */}
        <button
          type="button"
          onClick={handleTapActiveExecutionCard}
          className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:border-emerald-400 hover:shadow-md active:scale-[0.99] sm:p-4 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-500/50"
        >
          <div className="flex w-full items-center justify-between gap-1">
            <span className="truncate text-[11px] font-medium text-slate-500 sm:text-xs dark:text-zinc-400">
              En Ejecución Activa
            </span>
            <Clapperboard className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-1.5 font-mono text-xl font-bold tracking-tight text-slate-900 sm:mt-2 sm:text-2xl dark:text-white">
            {activeProjects.length}{' '}
            <span className="text-xs font-normal text-slate-400 sm:text-sm">
              de {boutiqueCapacity}
            </span>
          </p>
          <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px] text-slate-500 sm:text-xs dark:text-zinc-400">
            <span className="truncate">
              Capacidad ({Math.round((activeProjects.length / boutiqueCapacity) * 100)}%)
            </span>
            <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-emerald-600 group-hover:underline dark:text-emerald-400">
              Ir a fases <ArrowDown className="h-3 w-3" />
            </span>
          </div>
        </button>

        {/* KPI 2: Flujo de Caja Neto -> Al hacer tap despliega el detalle en el apartado de finanzas */}
        <button
          type="button"
          onClick={() => handleTapFinanceCard('cashflow')}
          aria-expanded={activeFinancePanel === 'cashflow'}
          className={`group flex flex-col justify-between rounded-2xl border p-3.5 text-left shadow-sm transition active:scale-[0.99] sm:p-4 ${
            activeFinancePanel === 'cashflow'
              ? 'border-sky-500 bg-sky-50/40 ring-2 ring-sky-500/20 dark:border-sky-400 dark:bg-sky-950/25'
              : 'border-slate-200 bg-white hover:border-sky-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-500/50'
          }`}
        >
          <div className="flex w-full items-center justify-between gap-1">
            <span className="truncate text-[11px] font-medium text-slate-500 sm:text-xs dark:text-zinc-400">
              Flujo de Caja Neto
            </span>
            <TrendingUp className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
          </div>
          <p
            className="mt-1.5 font-mono text-xl font-bold tracking-tight text-emerald-600 sm:mt-2 sm:text-2xl dark:text-emerald-400"
            title={formatCLP(flujoCajaProyectado)}
          >
            {formatCompactCLP(flujoCajaProyectado)}
          </p>
          <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px] text-slate-500 sm:text-xs dark:text-zinc-400">
            <span className="truncate">Ventas - gastos</span>
            <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-sky-600 dark:text-sky-400">
              {activeFinancePanel === 'cashflow' ? 'Ocultar' : 'Detalle'}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${
                  activeFinancePanel === 'cashflow' ? 'rotate-180' : ''
                }`}
              />
            </span>
          </div>
        </button>

        {/* KPI 3: Provisión F29 (SII) -> Al hacer tap despliega el detalle en el apartado de finanzas */}
        <button
          type="button"
          onClick={() => handleTapFinanceCard('f29')}
          aria-expanded={activeFinancePanel === 'f29'}
          className={`group flex flex-col justify-between rounded-2xl border p-3.5 text-left shadow-sm transition active:scale-[0.99] sm:p-4 ${
            activeFinancePanel === 'f29'
              ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20 dark:border-amber-400 dark:bg-amber-950/25'
              : 'border-slate-200 bg-white hover:border-amber-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-amber-500/50'
          }`}
        >
          <div className="flex w-full items-center justify-between gap-1">
            <span className="truncate text-[11px] font-medium text-slate-500 sm:text-xs dark:text-zinc-400">
              Provisión F29 (SII)
            </span>
            <Landmark className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          </div>
          <p
            className="mt-1.5 font-mono text-xl font-bold tracking-tight text-slate-900 sm:mt-2 sm:text-2xl dark:text-white"
            title={formatCLP(f29ObligacionDirecta)}
          >
            {formatCompactCLP(f29ObligacionDirecta)}
          </p>
          <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px] text-slate-500 sm:text-xs dark:text-zinc-400">
            <span className="truncate">IVA + BHE 15,25%</span>
            <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-amber-600 dark:text-amber-400">
              {activeFinancePanel === 'f29' ? 'Ocultar' : 'Detalle'}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${
                  activeFinancePanel === 'f29' ? 'rotate-180' : ''
                }`}
              />
            </span>
          </div>
        </button>

        {/* KPI 4: Presupuesto Ejecutado -> Al hacer tap despliega el detalle en el apartado de finanzas */}
        <button
          type="button"
          onClick={() => handleTapFinanceCard('budget')}
          aria-expanded={activeFinancePanel === 'budget'}
          className={`group flex flex-col justify-between rounded-2xl border p-3.5 text-left shadow-sm transition active:scale-[0.99] sm:p-4 ${
            activeFinancePanel === 'budget'
              ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20 dark:border-rose-400 dark:bg-rose-950/25'
              : 'border-slate-200 bg-white hover:border-rose-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-rose-500/50'
          }`}
        >
          <div className="flex w-full items-center justify-between gap-1">
            <span className="truncate text-[11px] font-medium text-slate-500 sm:text-xs dark:text-zinc-400">
              Presupuesto Ejecutado
            </span>
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5 sm:mt-2">
            <p className="font-mono text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              {formatPct(presupuestoEjecutadoPct)}
            </p>
            <span className="truncate font-mono text-[10px] text-slate-400 sm:text-xs dark:text-zinc-500">
              ({formatCompactCLP(totals.costoRealDevengado)} /{' '}
              {formatCompactCLP(totals.costoDirectoPresupuestado)})
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px] text-slate-500 sm:text-xs dark:text-zinc-400">
            <span className="truncate">
              {totals.redCount} sobrecosto · {totals.yellowCount} alerta
            </span>
            <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-rose-600 dark:text-rose-400">
              {activeFinancePanel === 'budget' ? 'Ocultar' : 'Detalle'}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${
                  activeFinancePanel === 'budget' ? 'rotate-180' : ''
                }`}
              />
            </span>
          </div>
        </button>
      </div>

      {/* Apartado de Finanzas: Detalle Asociado al hacer tap en Flujo de Caja, Provisión F29 o Presupuesto Ejecutado */}
      {activeFinancePanel && (
        <div
          ref={financeSectionRef}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900"
        >
          {/* Cabecera del Apartado de Finanzas con pestañas rápidas */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-zinc-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Apartado de Finanzas · Detalle Asociado
              </span>
              <h2 className="text-sm font-bold text-slate-900 sm:text-base dark:text-white">
                {activeFinancePanel === 'cashflow' &&
                  'Desglose de Flujo de Caja Neto Proyectado'}
                {activeFinancePanel === 'f29' &&
                  'Desglose Tributario Provisión F29 (SII Chile)'}
                {activeFinancePanel === 'budget' &&
                  'Desglose de Ejecución Presupuestaria y Semáforo'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveFinancePanel('cashflow')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  activeFinancePanel === 'cashflow'
                    ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-zinc-950'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                Flujo Caja ({formatCompactCLP(flujoCajaProyectado)})
              </button>
              <button
                type="button"
                onClick={() => setActiveFinancePanel('f29')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  activeFinancePanel === 'f29'
                    ? 'bg-amber-500 text-white dark:bg-amber-400 dark:text-zinc-950'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                Provisión F29 ({formatCompactCLP(f29ObligacionDirecta)})
              </button>
              <button
                type="button"
                onClick={() => setActiveFinancePanel('budget')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  activeFinancePanel === 'budget'
                    ? 'bg-rose-600 text-white dark:bg-rose-500 dark:text-zinc-950'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                Presupuesto ({formatPct(presupuestoEjecutadoPct)})
              </button>
              <button
                type="button"
                onClick={() => setActiveFinancePanel(null)}
                className="ml-1 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                title="Cerrar apartado de finanzas"
              >
                <X className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cerrar</span>
              </button>
            </div>
          </div>

          {/* 1. Detalle de Flujo de Caja Neto */}
          {activeFinancePanel === 'cashflow' && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Ventas Netas Totales (Sin IVA)
                  </span>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                      {formatCompactCLP(totals.precioVentaNeto)}
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">
                      {formatCLP(totals.precioVentaNeto)}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Gastos Reales Devengados
                  </span>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-lg font-bold text-rose-600 dark:text-rose-400">
                      -{formatCompactCLP(totals.costoRealDevengado)}
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">
                      {formatCLP(totals.costoRealDevengado)}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-500/30 dark:bg-emerald-950/30">
                  <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                    Flujo de Caja Neto Disponible
                  </span>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-300">
                      {formatCompactCLP(flujoCajaProyectado)}
                    </span>
                    <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {formatCLP(flujoCajaProyectado)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Aporte al Flujo de Caja por Proyecto
                </h3>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {workflowProjects.map((proj) => {
                    const m = proj.metrics;
                    return (
                      <div
                        key={proj.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => onSelectProject(proj.id)}
                            className="truncate font-semibold text-slate-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
                          >
                            {proj.name}
                          </button>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                            Venta: {formatCompactCLP(m.precioVentaNeto)} · Gasto:{' '}
                            {formatCompactCLP(m.costoRealTotal)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="block font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCompactCLP(m.utilidadRealActual)}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {formatCLP(m.utilidadRealActual)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2. Detalle de Provisión F29 (SII) */}
          {activeFinancePanel === 'f29' && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    IVA Débito Fiscal (19% Ventas)
                  </span>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                      {formatCompactCLP(totals.ivaDebito)}
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">
                      {formatCLP(totals.ivaDebito)}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Retención BHE (15,25% Honorarios 2026)
                  </span>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">
                      {formatCompactCLP(totals.retencionesBHE1525)}
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">
                      {formatCLP(totals.retencionesBHE1525)}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-500/30 dark:bg-amber-950/30">
                  <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-300">
                    Total Provisión F29 Directa (SII)
                  </span>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-lg font-bold text-amber-800 dark:text-amber-300">
                      {formatCompactCLP(f29ObligacionDirecta)}
                    </span>
                    <span className="font-mono text-xs font-semibold text-amber-800 dark:text-amber-400">
                      {formatCLP(f29ObligacionDirecta)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Desglose Tributario F29 por Proyecto
                </h3>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {workflowProjects.map((proj) => {
                    const m = proj.metrics;
                    const projF29 = m.ivaDebito + m.totalRetencionesBHE;
                    return (
                      <div
                        key={proj.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => onSelectProject(proj.id)}
                            className="truncate font-semibold text-slate-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
                          >
                            {proj.name}
                          </button>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                            IVA 19%: {formatCompactCLP(m.ivaDebito)} · BHE 15,25%:{' '}
                            {formatCompactCLP(m.totalRetencionesBHE)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="block font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                            {formatCompactCLP(projF29)}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {formatCLP(projF29)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. Detalle de Presupuesto Ejecutado */}
          {activeFinancePanel === 'budget' && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Presupuesto Directo Total
                  </span>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                      {formatCompactCLP(totals.costoDirectoPresupuestado)}
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">
                      {formatCLP(totals.costoDirectoPresupuestado)}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Presupuesto Ejecutado Real ({formatPct(presupuestoEjecutadoPct)})
                  </span>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-lg font-bold text-rose-600 dark:text-rose-400">
                      {formatCompactCLP(totals.costoRealDevengado)}
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">
                      {formatCLP(totals.costoRealDevengado)}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Saldo Presupuestario Disponible
                  </span>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCompactCLP(
                        totals.costoDirectoPresupuestado - totals.costoRealDevengado
                      )}
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">
                      {formatCLP(
                        totals.costoDirectoPresupuestado - totals.costoRealDevengado
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Estado de Ejecución Presupuestaria por Proyecto
                </h3>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {workflowProjects.map((proj) => {
                    const m = proj.metrics;
                    const sem = m.semaphore;
                    return (
                      <div
                        key={proj.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onSelectProject(proj.id)}
                              className="truncate font-semibold text-slate-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
                            >
                              {proj.name}
                            </button>
                            <span
                              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sem.badgeClass}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${sem.dotClass}`} />
                              {sem.shortLabel}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">
                            Ejecutado: {formatCompactCLP(m.costoRealTotal)} de{' '}
                            {formatCompactCLP(m.costoDirectoTotal)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`block font-mono text-sm font-bold ${sem.textClass}`}>
                            {formatPct(sem.ratio)}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {formatCLP(m.costoRealTotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmación de Traspaso de Fase entre Grupos */}
      {phaseTransitionFeedback && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50/90 px-4 py-3 text-xs text-emerald-950 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>{phaseTransitionFeedback.projectName}</strong> pasó de{' '}
              <span className="font-semibold underline decoration-emerald-400/60">
                {phaseTransitionFeedback.fromLabel}
              </span>{' '}
              al grupo{' '}
              <span className="rounded-md bg-emerald-600 px-2 py-0.5 font-semibold text-white dark:bg-emerald-500 dark:text-zinc-950">
                {phaseTransitionFeedback.toLabel}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleFocusPhaseMobile(phaseTransitionFeedback.toPhaseId)}
              className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 font-semibold text-emerald-700 transition hover:bg-emerald-100 lg:hidden dark:border-emerald-500/40 dark:bg-zinc-900 dark:text-emerald-300"
            >
              Ir a {phaseTransitionFeedback.toLabel}
            </button>
            <button
              type="button"
              onClick={handleDismissFeedback}
              className="rounded-lg px-2 py-1 font-medium text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Bandeja de Cotizaciones Guardadas Pendientes de Confirmación por el Cliente */}
      {pendingQuoteProjects.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-300/90 bg-amber-50/60 p-4 shadow-sm dark:border-amber-500/40 dark:bg-amber-950/20">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Cotizaciones Pendientes de Confirmación ({pendingQuoteProjects.length})
                </h2>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Envía el PDF por WhatsApp o Mail al cliente y, una vez aprobado el presupuesto, confírmalo aquí para activarlo en los flujos de trabajo.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {pendingQuoteProjects.map((quoteProj) => {
              const { metrics } = quoteProj;
              const prodMeta =
                PRODUCTION_TYPES[quoteProj.projectType] ||
                PRODUCTION_TYPES.video_corporativo;
              const targetPhaseMeta = getPhaseMeta(quoteProj.normalizedPhase);

              return (
                <div
                  key={quoteProj.id}
                  className="flex flex-col justify-between rounded-xl border border-amber-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                        {quoteProj.code} · EN COTIZACIÓN
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                        {quoteProj.client}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectProject(quoteProj.id)}
                      className="mt-1.5 block text-left"
                    >
                      <h3 className="text-sm font-bold text-slate-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400">
                        {quoteProj.name}
                      </h3>
                    </button>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {prodMeta.label}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {quoteProj.shootDates}
                      </span>
                    </div>

                    {/* Enunciados con margen integrado */}
                    <div className="mt-2.5 grid grid-cols-2 gap-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2 text-[11px] dark:border-zinc-800 dark:bg-zinc-900/60">
                      {metrics.categoryBreakdown.map((cat) => (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between gap-1 rounded-lg bg-white px-2 py-1 dark:bg-zinc-950"
                        >
                          <span className="truncate text-slate-500 dark:text-zinc-400">
                            {cat.shortLabel}
                          </span>
                          <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">
                            {formatCompactCLP(cat.quotedNet)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                      <div>
                        <span className="block text-[10px] text-slate-400">
                          Valor Neto (c/margen {quoteProj.desiredMarginPct}%)
                        </span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">
                          {formatCLP(metrics.precioVentaNeto)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400">IVA Débito (19%)</span>
                        <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                          {formatCLP(metrics.ivaDebito)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                          Total Propuesta (c/IVA)
                        </span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          {formatCLP(metrics.precioVentaBruto)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-zinc-800">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => downloadQuotePdf(quoteProj)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-800 dark:border-zinc-700 dark:bg-white dark:text-zinc-950"
                        title="Descargar PDF de Cotización"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        <span>PDF</span>
                      </button>

                      <a
                        href={buildWhatsAppQuoteUrl(quoteProj)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                        title="Enviar cotización por WhatsApp"
                      >
                        <Send className="h-3 w-3" />
                        <span>WhatsApp</span>
                      </a>

                      <a
                        href={buildMailtoQuoteUrl(quoteProj)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                        title="Enviar cotización por Correo"
                      >
                        <Mail className="h-3 w-3" />
                        <span>Mail</span>
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleConfirmQuoteAndActivate(quoteProj)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Confirmar Presupuesto (Activar en {targetPhaseMeta.shortLabel})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Apartado de Filtros Minimalistas, Acordeones por Fase y Tablero Kanban */}
      <div ref={accordionsContainerRef} className="scroll-mt-4 space-y-3">
        {/* Barra Minimalista Unificada de Filtros de Proyectos (Fase + Estado) */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-800 dark:text-zinc-100">
              Proyectos ({filteredProjects.length})
            </span>

            <span className="text-slate-300 dark:text-zinc-700">·</span>

            {/* Chip de Fase activa o disparador rápido a la modal */}
            {activePhaseMeta ? (
              <button
                type="button"
                onClick={() => handleSelectPhaseFilter('all')}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                title="Quitar filtro de fase"
              >
                <span>{activePhaseMeta.shortLabel}</span>
                <X className="h-3 w-3" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                className="rounded-lg px-1.5 py-0.5 text-[11px] text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                Todas las fases
              </button>
            )}

            {/* Chip de Estado activo o disparador rápido a la modal */}
            {semaphoreFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => setSemaphoreFilter('all')}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-800 transition hover:bg-slate-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                title="Quitar filtro de estado"
              >
                <span className={`h-2 w-2 rounded-full ${activeSemaphoreOption.dotClass}`} />
                <span>{activeSemaphoreOption.shortLabel}</span>
                <X className="h-3 w-3" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                className="rounded-lg px-1.5 py-0.5 text-[11px] text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                Todos los estados
              </button>
            )}

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[11px] font-medium text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                title="Restablecer todos los filtros"
              >
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleAllAccordions}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 lg:hidden dark:border-zinc-800 dark:bg-zinc-800/70 dark:text-zinc-300"
              title={allExpanded ? 'Contraer fases' : 'Expandir fases'}
            >
              <ChevronsUpDown className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">
                {allExpanded ? 'Contraer' : 'Expandir'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                activeFiltersCount > 0
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm dark:border-emerald-500 dark:bg-emerald-500 dark:text-zinc-950'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                    activeFiltersCount > 0
                      ? 'bg-white/20 text-white dark:bg-zinc-950/20 dark:text-zinc-950'
                      : ''
                  }`}
                >
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tablero Kanban Estandarizado (Acordeón desplegable en Mobile / Columnas en Desktop) */}
        <div
          className={`grid grid-cols-1 gap-4 ${
            visiblePhases.length === 1 ? 'lg:grid-cols-1' : 'lg:grid-cols-4'
          }`}
        >
        {visiblePhases.map((phase) => {
          const phaseProjects = filteredProjects.filter(
            (p) => p.normalizedPhase === phase.id
          );
          const currentPhaseIdx = phaseOrder.indexOf(phase.id);
          const isExpanded = Boolean(openPhases[phase.id]);

          return (
            <div
              key={phase.id}
              ref={(el) => {
                phaseSectionRefs.current[phase.id] = el;
              }}
              className="flex flex-col rounded-2xl border border-slate-200 bg-slate-100/70 p-3 transition-all dark:border-zinc-800/90 dark:bg-zinc-900/50"
            >
              {/* Cabecera de Columna / Botón de Acordeón en Mobile */}
              <button
                type="button"
                onClick={() => togglePhaseAccordion(phase.id)}
                aria-expanded={isExpanded}
                aria-controls={`phase-group-${phase.id}`}
                className="flex w-full items-center justify-between rounded-xl px-1.5 py-1 text-left transition hover:bg-slate-200/50 lg:cursor-default lg:hover:bg-transparent dark:hover:bg-zinc-800/50 lg:dark:hover:bg-transparent"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${phase.badgeColor}`}
                  >
                    {phase.label}
                  </span>
                  {/* Indicadores rápidos de semáforo cuando el acordeón está contraído en mobile */}
                  {!isExpanded && phaseProjects.length > 0 && (
                    <div className="flex items-center gap-1 lg:hidden">
                      {phaseProjects.map((proj) => (
                        <span
                          key={proj.id}
                          className={`h-2 w-2 rounded-full ${proj.metrics.semaphore.dotClass}`}
                          title={`${proj.name}: ${proj.metrics.semaphore.label}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-700 shadow-sm dark:bg-zinc-800 dark:text-zinc-200">
                    {phaseProjects.length}{' '}
                    <span className="font-sans text-[10px] font-normal text-slate-400 lg:hidden">
                      {phaseProjects.length === 1 ? 'proy.' : 'proys.'}
                    </span>
                  </span>

                  {/* Icono desplegable exclusivo para mobile (< lg) */}
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-transform duration-200 lg:hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </div>
              </button>

              {/* Contenido del Grupo: Colapsable en Mobile, siempre visible en Desktop (lg:flex) */}
              <div
                id={`phase-group-${phase.id}`}
                className={`${
                  isExpanded ? 'mt-3 flex' : 'hidden'
                } flex-1 flex-col gap-3 lg:mt-3 lg:flex`}
              >
                {phaseProjects.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400 dark:border-zinc-800 dark:text-zinc-500">
                    Sin proyectos en {phase.label}
                  </div>
                ) : (
                  phaseProjects.map((project) => {
                    const { metrics } = project;
                    const sem = metrics.semaphore;
                    const barWidth = Math.min(100, Math.max(0, sem.ratio));
                    const prodTypeMeta =
                      PRODUCTION_TYPES[project.projectType] ||
                      PRODUCTION_TYPES.video_corporativo;
                    const isRecentlyMoved =
                      phaseTransitionFeedback &&
                      phaseTransitionFeedback.projectId === project.id;

                    return (
                      <div
                        key={project.id}
                        className={`group flex flex-col justify-between rounded-xl border bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:bg-zinc-950 dark:hover:border-zinc-700 ${
                          isRecentlyMoved
                            ? 'border-emerald-500 ring-2 ring-emerald-500/30 dark:border-emerald-400'
                            : 'border-slate-200 dark:border-zinc-800'
                        }`}
                      >
                        <div>
                          {/* Cliente + Semáforo */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-medium text-slate-500 dark:text-zinc-400">
                              {project.client}
                            </span>
                            <span
                              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sem.badgeClass}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${sem.dotClass}`} />
                              {sem.shortLabel}
                            </span>
                          </div>

                          {/* Título del Proyecto */}
                          <button
                            type="button"
                            onClick={() => onSelectProject(project.id)}
                            className="mt-1.5 block text-left"
                          >
                            <h3 className="text-sm font-semibold leading-snug text-slate-900 transition group-hover:text-emerald-600 dark:text-zinc-100 dark:group-hover:text-emerald-400">
                              {project.name}
                            </h3>
                          </button>

                          {/* Tipo de Producción + Rango de Fechas */}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {prodTypeMeta.label}
                            </span>
                            {project.shootDates && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {project.shootDates}
                              </span>
                            )}
                          </div>

                          {/* Partner de Distribución en fase Entrega / Lanzamiento */}
                          {project.distributionPartner && (
                            <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-2 py-1 text-[11px] text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                              <Share2 className="h-3 w-3 shrink-0" />
                              <span className="truncate font-medium">
                                {project.distributionPartner}
                              </span>
                            </div>
                          )}

                          {/* Barra de Presupuesto Limpia */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 dark:text-zinc-400">
                                {formatCLP(metrics.costoRealTotal)}{' '}
                                <span className="text-slate-400 dark:text-zinc-500">
                                  / {formatCLP(metrics.costoDirectoTotal)}
                                </span>
                              </span>
                              <span className={`font-mono text-xs font-bold ${sem.textClass}`}>
                                {formatPct(sem.ratio, 0)}
                              </span>
                            </div>

                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${sem.barClass}`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Pie de Tarjeta: Cambio de Fase Directo + Botones Anterior/Siguiente + Abrir */}
                        <div className="mt-3.5 space-y-2 border-t border-slate-100 pt-2.5 text-xs dark:border-zinc-800/80">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={currentPhaseIdx <= 0}
                                onClick={() =>
                                  handleMovePhaseWithConfirmation(
                                    project,
                                    phaseOrder[currentPhaseIdx - 1]
                                  )
                                }
                                className="rounded-lg border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                                title="Mover a fase anterior"
                                aria-label="Mover a fase anterior"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={currentPhaseIdx >= phaseOrder.length - 1}
                                onClick={() =>
                                  handleMovePhaseWithConfirmation(
                                    project,
                                    phaseOrder[currentPhaseIdx + 1]
                                  )
                                }
                                className="rounded-lg border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                                title="Mover a siguiente fase"
                                aria-label="Mover a siguiente fase"
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Selector directo de fase para mover a cualquier grupo en 1 toque */}
                            <select
                              aria-label={`Cambiar fase de ${project.name}`}
                              value={project.normalizedPhase}
                              onChange={(e) =>
                                handleMovePhaseWithConfirmation(project, e.target.value)
                              }
                              className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 transition focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                            >
                              {PROJECT_PHASES.map((ph) => (
                                <option key={ph.id} value={ph.id}>
                                  {ph.shortLabel}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                              {project.normalizedPhase === PHASE_IDS.DELIVERY_LAUNCH ? (
                                <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                  <Share2 className="h-3 w-3" /> En Lanzamiento
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {project.daysRemaining}d restantes
                                </span>
                              )}
                            </span>

                            <button
                              type="button"
                              onClick={() => onSelectProject(project.id)}
                              className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                            >
                              <span>Abrir</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Modal Minimalista de Filtros de Proyectos (Fase + Estado Presupuestario) */}
      <NativeModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filtrar Proyectos"
        subtitle="Selecciona la fase de producción y el estado presupuestario"
        icon={SlidersHorizontal}
        accentColor="emerald"
        maxWidth="max-w-md"
      >
        <div className="space-y-5 text-xs">
          {/* 1. Filtro por Fase */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Fase del Proyecto
              </span>
              {phaseFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => handleSelectPhaseFilter('all')}
                  className="text-[11px] font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Ver todas
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPhaseFilter('all')}
                className={`col-span-2 flex items-center justify-between rounded-xl border px-3 py-2.5 text-left font-semibold transition ${
                  phaseFilter === 'all'
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-zinc-950'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300'
                }`}
              >
                <span>Todas las fases</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                    phaseFilter === 'all'
                      ? 'bg-white/20 text-white dark:bg-zinc-950/20 dark:text-zinc-950'
                      : 'bg-white text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  {statusFilteredProjects.length}
                </span>
              </button>

              {PROJECT_PHASES.map((phase) => {
                const count = statusFilteredProjects.filter(
                  (p) => p.normalizedPhase === phase.id
                ).length;
                const isSelected = phaseFilter === phase.id;
                return (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => handleSelectPhaseFilter(phase.id)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left font-semibold transition ${
                      isSelected
                        ? phase.badgeColor
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300'
                    }`}
                  >
                    <span className="truncate">{phase.shortLabel}</span>
                    <span className="ml-1.5 rounded-full bg-white/90 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 shadow-sm dark:bg-zinc-800 dark:text-zinc-200">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Filtro por Estado Presupuestario */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Estado Presupuestario
              </span>
              {semaphoreFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSemaphoreFilter('all')}
                  className="text-[11px] font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Ver todos
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {SEMAPHORE_OPTIONS.map((opt) => {
                const isSelected = semaphoreFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSemaphoreFilter(opt.id)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left font-semibold transition ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${opt.dotClass}`} />
                      <span className="truncate">{opt.shortLabel}</span>
                    </span>
                    <span
                      className={`ml-1.5 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white dark:bg-zinc-950/20 dark:text-zinc-950'
                          : 'bg-white text-slate-700 dark:bg-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {opt.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pie de la Modal */}
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={activeFiltersCount === 0}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Limpiar filtros</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFilterModalOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white shadow-sm transition hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
            >
              <span>Ver proyectos ({filteredProjects.length})</span>
            </button>
          </div>
        </div>
      </NativeModal>

      {/* Modal Cotizar Proyecto */}
      <ScheduleEstimatorModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateProjectWithAccordion}
        onConfirmQuote={onConfirmQuote}
      />
    </div>
  );
}
