import React, { useState } from 'react';
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
  Share2,
  Calendar,
} from 'lucide-react';
import {
  PROJECT_PHASES,
  PHASE_IDS,
  PRODUCTION_TYPES,
  normalizeProjectPhase,
  computeProjectMetrics,
  formatCLP,
  formatPct,
} from '../utils/finance';
import ScheduleEstimatorModal from './ScheduleEstimatorModal';

export default function DirectorDashboard({
  projects,
  onSelectProject,
  onMoveProjectPhase,
  onCreateProject,
}) {
  const [semaphoreFilter, setSemaphoreFilter] = useState('all');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  const enrichedProjects = projects.map((project) => ({
    ...project,
    normalizedPhase: normalizeProjectPhase(project.phase),
    metrics: computeProjectMetrics(project),
  }));

  const activeProjects = enrichedProjects.filter(
    (p) => p.normalizedPhase !== PHASE_IDS.DELIVERY_LAUNCH
  );
  const boutiqueCapacity = 5;

  const totals = enrichedProjects.reduce(
    (acc, item) => {
      const m = item.metrics;
      acc.costoDirectoPresupuestado += m.costoDirectoTotal;
      acc.costoRealDevengado += m.costoRealTotal;
      acc.precioVentaNeto += m.precioVentaNeto;
      acc.ivaDebito += m.ivaDebito;
      acc.retencionesBHE1525 += m.totalRetencionesBHE;

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
      redCount: 0,
      yellowCount: 0,
      greenCount: 0,
    }
  );

  const flujoCajaProyectado = totals.precioVentaNeto - totals.costoRealDevengado;
  const f29ObligacionDirecta = totals.ivaDebito + totals.retencionesBHE1525;

  const filteredProjects = enrichedProjects.filter((p) => {
    if (semaphoreFilter === 'all') return true;
    return p.metrics.semaphore.level === semaphoreFilter;
  });

  const phaseOrder = PROJECT_PHASES.map((p) => p.id);

  return (
    <div className="space-y-6">
      {/* Encabezado limpio */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Panel de Proyectos
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Ciclo de vida estandarizado (Preproducción → Rodaje → Postproducción → Entrega / Lanzamiento)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtro simple por estado */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setSemaphoreFilter('all')}
              className={`rounded-lg px-2.5 py-1 font-medium transition ${
                semaphoreFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-zinc-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Todos ({enrichedProjects.length})
            </button>
            <button
              type="button"
              onClick={() => setSemaphoreFilter('green')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition ${
                semaphoreFilter === 'green'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                  : 'text-slate-600 hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-300'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              En regla ({totals.greenCount})
            </button>
            <button
              type="button"
              onClick={() => setSemaphoreFilter('yellow')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition ${
                semaphoreFilter === 'yellow'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                  : 'text-slate-600 hover:text-amber-700 dark:text-zinc-400 dark:hover:text-amber-300'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Alerta ({totals.yellowCount})
            </button>
            <button
              type="button"
              onClick={() => setSemaphoreFilter('red')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition ${
                semaphoreFilter === 'red'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                  : 'text-slate-600 hover:text-rose-700 dark:text-zinc-400 dark:hover:text-rose-300'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Sobrecosto ({totals.redCount})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Proyecto (Estimador)</span>
          </button>
        </div>
      </div>

      {/* 4 Tarjetas KPI Simplificadas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* KPI 1: Proyectos en Rodaje / Post / Pre */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              En Ejecución Activa
            </span>
            <Clapperboard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white">
            {activeProjects.length}{' '}
            <span className="text-sm font-normal text-slate-400">
              de {boutiqueCapacity}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Capacidad operativa ({Math.round((activeProjects.length / boutiqueCapacity) * 100)}%)
          </p>
        </div>

        {/* KPI 2: Flujo de Caja Proyectado */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Flujo de Caja Neto
            </span>
            <TrendingUp className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCLP(flujoCajaProyectado)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Ventas netas menos gastos reales
          </p>
        </div>

        {/* KPI 3: Saldo Estimado F29 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Provisión F29 (SII)
            </span>
            <Landmark className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white">
            {formatCLP(f29ObligacionDirecta)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            IVA 19% + Retenciones BHE 15,25%
          </p>
        </div>

        {/* KPI 4: Estado Presupuestario */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Presupuesto Ejecutado
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-500 dark:text-rose-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white">
            {formatPct(
              (totals.costoRealDevengado / (totals.costoDirectoPresupuestado || 1)) * 100
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            {totals.redCount} en sobrecosto · {totals.yellowCount} en alerta
          </p>
        </div>
      </div>

      {/* Tablero Kanban Estandarizado (4 Fases) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {PROJECT_PHASES.map((phase) => {
          const phaseProjects = filteredProjects.filter(
            (p) => p.normalizedPhase === phase.id
          );
          const currentPhaseIdx = phaseOrder.indexOf(phase.id);

          return (
            <div
              key={phase.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-slate-100/70 p-3 dark:border-zinc-800/90 dark:bg-zinc-900/50"
            >
              {/* Cabecera de Columna */}
              <div className="mb-3 flex items-center justify-between px-1">
                <span
                  className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${phase.badgeColor}`}
                >
                  {phase.label}
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 font-mono text-xs font-semibold text-slate-600 shadow-sm dark:bg-zinc-800 dark:text-zinc-300">
                  {phaseProjects.length}
                </span>
              </div>

              {/* Tarjetas de la Columna */}
              <div className="flex flex-1 flex-col gap-3">
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

                    return (
                      <div
                        key={project.id}
                        className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
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

                        {/* Pie de Tarjeta */}
                        <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs dark:border-zinc-800/80">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={currentPhaseIdx <= 0}
                              onClick={() =>
                                onMoveProjectPhase(
                                  project.id,
                                  phaseOrder[currentPhaseIdx - 1]
                                )
                              }
                              className="rounded-lg border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                              title="Fase anterior"
                              aria-label="Fase anterior"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={currentPhaseIdx >= phaseOrder.length - 1}
                              onClick={() =>
                                onMoveProjectPhase(
                                  project.id,
                                  phaseOrder[currentPhaseIdx + 1]
                                )
                              }
                              className="rounded-lg border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                              title="Siguiente fase"
                              aria-label="Siguiente fase"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                            <span className="ml-1 text-[11px] text-slate-400 dark:text-zinc-500">
                              {project.normalizedPhase === PHASE_IDS.DELIVERY_LAUNCH ? (
                                <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                  <Share2 className="h-3 w-3" /> En Lanzamiento
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {project.daysRemaining}d
                                </span>
                              )}
                            </span>
                          </div>

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
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Wizard Estimador de Cronograma y Creación de Proyecto */}
      <ScheduleEstimatorModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={onCreateProject}
      />
    </div>
  );
}
