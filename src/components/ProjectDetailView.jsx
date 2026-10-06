import React, { useState } from 'react';
import {
  ArrowLeft,
  Calculator,
  Receipt,
  GitPullRequestDraft,
  Plus,
  Trash2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Calendar,
  MapPin,
  FileText,
  Clock,
  Info,
  Share2,
  FileDown,
  Send,
  Mail,
} from 'lucide-react';
import {
  BUDGET_CATEGORIES,
  PROJECT_PHASES,
  PHASE_IDS,
  PRODUCTION_TYPES,
  normalizeProjectPhase,
  IVA_RATE,
  calculateDocumentTax,
  computeProjectMetrics,
  formatCLP,
  formatPct,
} from '../utils/finance';
import {
  calculatePhaseSchedule,
  formatShortDateES,
} from '../utils/scheduleEstimator';
import {
  downloadQuotePdf,
  buildWhatsAppQuoteUrl,
  buildMailtoQuoteUrl,
} from '../utils/pdfQuoteGenerator';

export default function ProjectDetailView({
  project,
  allProjects,
  onSelectProject,
  onBackToDashboard,
  onUpdateBudgetCategory,
  onUpdateMargin,
  onUpdatePhase,
  onUpdateDistributionPartner,
  onAddExpense,
  onDeleteExpense,
  onToggleRevisionScope,
  onAddRevision,
  onConfirmQuote,
}) {
  const [activeTab, setActiveTab] = useState('presupuesto'); // 'presupuesto' | 'gastos' | 'revisiones'

  const [expenseForm, setExpenseForm] = useState({
    date: '2026-09-30',
    category: 'personal_tecnico',
    provider: '',
    tipoDoc: 'Boleta de Honorarios',
    montoBruto: '',
    notes: '',
  });

  const [revisionForm, setRevisionForm] = useState({
    videoUrl: 'https://vimeo.com/kinok/corte-revision-cliente',
    clientFeedback: '',
    estimatedHours: 4,
    outOfScope: false,
  });

  if (!project) return null;

  const normalizedPhase = normalizeProjectPhase(project.phase);
  const schedule =
    project.phaseSchedule && Array.isArray(project.phaseSchedule.phases)
      ? project.phaseSchedule
      : calculatePhaseSchedule({
          startDate: project.startDate || '2026-09-01',
          endDate: project.endDate || '2026-10-15',
          projectType: project.projectType || 'video_corporativo',
        });
  const prodTypeMeta =
    PRODUCTION_TYPES[project.projectType] || PRODUCTION_TYPES.video_corporativo;

  const metrics = computeProjectMetrics(project);
  const sem = metrics.semaphore;

  const previewExpenseTax = calculateDocumentTax(
    Number(expenseForm.montoBruto) || 0,
    expenseForm.tipoDoc
  );

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    const bruto = Number(expenseForm.montoBruto);
    if (!expenseForm.provider.trim() || !bruto || bruto <= 0) return;

    onAddExpense(project.id, {
      date: expenseForm.date,
      category: expenseForm.category,
      provider: expenseForm.provider.trim(),
      tipoDoc: expenseForm.tipoDoc,
      montoBruto: Math.round(bruto),
      notes: expenseForm.notes.trim() || 'Gasto registrado',
    });

    setExpenseForm({
      ...expenseForm,
      provider: '',
      montoBruto: '',
      notes: '',
    });
  };

  const handleRevisionSubmit = (e) => {
    e.preventDefault();
    if (!revisionForm.clientFeedback.trim() || !revisionForm.videoUrl.trim()) return;

    onAddRevision(project.id, {
      videoUrl: revisionForm.videoUrl.trim(),
      clientFeedback: revisionForm.clientFeedback.trim(),
      estimatedHours: Number(revisionForm.estimatedHours) || 1,
      outOfScope: Boolean(revisionForm.outOfScope),
    });

    setRevisionForm({
      videoUrl: 'https://vimeo.com/kinok/corte-v' + ((project.revisions?.length || 0) + 2),
      clientFeedback: '',
      estimatedHours: 4,
      outOfScope: false,
    });
  };

  const nextRoundNumber = (project.revisions?.length || 0) + 1;
  const availableBudget = metrics.costoDirectoTotal - metrics.costoRealTotal;

  return (
    <div className="space-y-6">
      {/* Banner si el proyecto está en estado Cotización Pendiente de Confirmación */}
      {project.quoteStatus === 'PENDING_APPROVAL' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 text-xs shadow-sm dark:border-amber-500/50 dark:bg-amber-950/30">
          <div className="flex items-start gap-2.5">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                Cotización {project.code} Pendiente de Confirmación por el Cliente
              </p>
              <p className="mt-0.5 text-slate-600 dark:text-zinc-300">
                Descarga el PDF o envíalo por WhatsApp/Mail. Cuando el cliente apruebe el presupuesto, confírmalo para activarlo en el tablero de flujos de trabajo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => downloadQuotePdf(project)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-zinc-950"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>PDF Cotización</span>
            </button>
            <a
              href={buildWhatsAppQuoteUrl(project)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/40 dark:bg-zinc-900 dark:text-emerald-300"
            >
              <Send className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </a>
            <a
              href={buildMailtoQuoteUrl(project)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Mail</span>
            </a>
            {typeof onConfirmQuote === 'function' && (
              <button
                type="button"
                onClick={() => onConfirmQuote(project.id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 font-bold text-white shadow-sm hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Confirmar Presupuesto y Activar Flujo</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cabecera Unificada del Proyecto */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Fila superior: Volver + Selector de Proyecto + Fase + Estado */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver</span>
            </button>

            <select
              id="project-switcher"
              aria-label="Cambiar de proyecto"
              value={project.id}
              onChange={(e) => onSelectProject(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            >
              {allProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => downloadQuotePdf(project)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              title="Descargar documento PDF de cotización"
            >
              <FileDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>PDF Cotización</span>
            </button>

            <span className="rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {prodTypeMeta.label}
            </span>

            <select
              value={normalizedPhase}
              onChange={(e) => onUpdatePhase(project.id, e.target.value)}
              aria-label="Fase del proyecto"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-emerald-300"
            >
              {PROJECT_PHASES.map((ph) => (
                <option key={ph.id} value={ph.id}>
                  Fase: {ph.label}
                </option>
              ))}
            </select>

            <span
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${sem.badgeClass}`}
            >
              <span className={`h-2 w-2 rounded-full ${sem.dotClass}`} />
              <span>
                {sem.label} ({formatPct(sem.ratio, 0)})
              </span>
            </span>
          </div>
        </div>

        {/* Datos Principales + Resumen de Ejecución */}
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              {project.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <strong className="text-slate-700 dark:text-zinc-200">{project.client}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                {project.shootLocation}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                {project.shootDates}
              </span>
            </div>

            {/* Cronograma Gantt Compacto de Fases */}
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/70">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-zinc-300">
                  Cronograma Estimado ({schedule.totalDays} días)
                </span>
                <span className="font-mono text-slate-500 dark:text-zinc-400">
                  Entrega / Lanzamiento: {formatShortDateES(schedule.endDate)}
                </span>
              </div>
              <div className="flex h-5 w-full overflow-hidden rounded-lg bg-slate-200 dark:bg-zinc-800">
                {schedule.phases
                  .filter((ph) => !ph.isMilestone)
                  .map((ph) => {
                    const colorClass =
                      ph.id === PHASE_IDS.PRE_PRODUCTION
                        ? 'bg-sky-500'
                        : ph.id === PHASE_IDS.PRODUCTION
                        ? 'bg-violet-500 border-x border-white/30'
                        : 'bg-indigo-500';
                    return (
                      <div
                        key={ph.id}
                        style={{ width: `${Math.max(8, ph.percentage)}%` }}
                        className={`flex items-center justify-center px-1.5 text-[10px] font-bold text-white ${colorClass}`}
                        title={`${ph.label}: ${ph.days} días (${formatShortDateES(
                          ph.startDate,
                          false
                        )} → ${formatShortDateES(ph.endDate, false)})`}
                      >
                        <span className="truncate">
                          {ph.shortLabel} {ph.percentage}% ({ph.days}d)
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* Partner de Distribución / Agencia de Lanzamiento */}
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-2 text-xs dark:border-zinc-800">
                <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                  <Share2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Partner Distribución / Lanzamiento:</span>
                </label>
                <input
                  type="text"
                  placeholder="Sin partner asignado (ej. Agencia de medios / Canal)"
                  value={project.distributionPartner || ''}
                  onChange={(e) =>
                    onUpdateDistributionPartner &&
                    onUpdateDistributionPartner(project.id, e.target.value)
                  }
                  className="min-w-[240px] flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/70 lg:col-span-5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 dark:text-zinc-300">
                Presupuesto Ejecutado
              </span>
              <span className={`font-mono font-bold ${sem.textClass}`}>
                {formatCLP(metrics.costoRealTotal)} / {formatCLP(metrics.costoDirectoTotal)}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${sem.barClass}`}
                style={{ width: `${Math.min(100, Math.max(0, sem.ratio))}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
              <span>
                Saldo disponible:{' '}
                <strong
                  className={
                    availableBudget < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }
                >
                  {formatCLP(availableBudget)}
                </strong>
              </span>
              <span>Total a facturar: {formatCLP(metrics.totalFacturable)}</span>
            </div>
          </div>
        </div>

        {/* Pestañas Simples */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('presupuesto')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'presupuesto'
                ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950'
                : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            <Calculator className="h-4 w-4" />
            <span>Presupuesto y Cotización</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gastos')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'gastos'
                ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950'
                : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Gastos Reales ({project.expenses?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('revisiones')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'revisiones'
                ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950'
                : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            <GitPullRequestDraft className="h-4 w-4" />
            <span>Revisiones de Video ({project.revisions?.length || 0})</span>
            {metrics.outOfScopeCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
                  activeTab === 'revisiones'
                    ? 'bg-white/20 text-white dark:bg-zinc-950/30 dark:text-amber-200'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                }`}
              >
                +{metrics.outOfScopeCount} extra
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =======================================================================
          PESTAÑA 1: PRESUPUESTO Y COTIZACIÓN
         ======================================================================= */}
      {activeTab === 'presupuesto' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Izquierda: Partidas Presupuestarias */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Presupuesto por Categoría
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Ajusta los montos presupuestados para recalcular la cotización automáticamente
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {metrics.categoryBreakdown.map((cat) => {
                  const catSem = cat.semaphore;
                  return (
                    <div
                      key={cat.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/80"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${catSem.dotClass}`} />
                          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                            {cat.label}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateBudgetCategory(
                                project.id,
                                cat.id,
                                Math.max(0, cat.budgeted - 100000)
                              )
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs text-slate-600 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            -100k
                          </button>

                          <div className="relative">
                            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">
                              $
                            </span>
                            <input
                              type="number"
                              step="50000"
                              min="0"
                              aria-label={`Presupuesto para ${cat.label}`}
                              value={cat.budgeted}
                              onChange={(e) =>
                                onUpdateBudgetCategory(
                                  project.id,
                                  cat.id,
                                  Math.max(0, Number(e.target.value) || 0)
                                )
                              }
                              className="w-32 rounded-lg border border-slate-300 bg-white py-1 pl-6 pr-2.5 text-right font-mono text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              onUpdateBudgetCategory(project.id, cat.id, cat.budgeted + 100000)
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs text-slate-600 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            +100k
                          </button>
                        </div>
                      </div>

                      <div className="mt-2.5">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${catSem.barClass}`}
                            style={{ width: `${Math.min(100, Math.max(0, catSem.ratio))}%` }}
                          />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                          <span>
                            Gastado: <strong className={catSem.textClass}>{formatCLP(cat.spent)}</strong> ({formatPct(catSem.ratio, 0)})
                          </span>
                          <span>
                            Disponible:{' '}
                            <strong
                              className={
                                cat.variance < 0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-slate-700 dark:text-zinc-200'
                              }
                            >
                              {formatCLP(cat.variance)}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Derecha: Resumen de Cotización al Cliente */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Cotización al Cliente
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Cálculo automático de margen e IVA (19%)
                </p>
              </div>

              {/* Control de Margen */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="desired-margin-input"
                    className="text-xs font-semibold text-slate-700 dark:text-zinc-300"
                  >
                    Margen de Ganancia (%)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      id="desired-margin-input"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={project.desiredMarginPct}
                      onChange={(e) =>
                        onUpdateMargin(
                          project.id,
                          Math.max(0, Math.min(100, Number(e.target.value) || 0))
                        )
                      }
                      className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right font-mono text-sm font-bold text-emerald-600 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-emerald-400"
                    />
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      %
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="5"
                  max="70"
                  step="1"
                  aria-label="Deslizador de margen"
                  value={project.desiredMarginPct}
                  onChange={(e) => onUpdateMargin(project.id, Number(e.target.value))}
                  className="mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-emerald-600 dark:bg-zinc-800 dark:accent-emerald-500"
                />
              </div>

              {/* Resumen Limpio */}
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 text-slate-600 dark:text-zinc-300">
                  <span>Costo Directo (Presupuesto)</span>
                  <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                    {formatCLP(metrics.costoDirectoTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 text-slate-600 dark:text-zinc-300">
                  <span>+ Margen Comercial ({metrics.margenPct}%)</span>
                  <span className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    + {formatCLP(metrics.margenUtilidad)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 font-semibold text-slate-900 dark:border-zinc-800 dark:text-white">
                  <span>Precio de Venta Neto</span>
                  <span className="font-mono text-base">
                    {formatCLP(metrics.precioVentaNeto)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 text-slate-500 dark:text-zinc-400">
                  <span>+ IVA ({Math.round(IVA_RATE * 100)}%)</span>
                  <span className="font-mono text-sm font-medium text-amber-600 dark:text-amber-400">
                    + {formatCLP(metrics.ivaDebito)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 dark:border-emerald-500/40 dark:bg-emerald-950/40">
                  <div>
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      Total a Facturar (c/IVA)
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400/80">
                      Factura Electrónica SII
                    </p>
                  </div>
                  <span className="font-mono text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatCLP(metrics.totalFacturable)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          PESTAÑA 2: GASTOS REALES
         ======================================================================= */}
      {activeTab === 'gastos' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Izquierda: Formulario de Nuevo Gasto */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Registrar Nuevo Gasto
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Calcula automáticamente la retención de boletas (15,25%)
              </p>

              <form onSubmit={handleExpenseSubmit} className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                      Fecha
                    </label>
                    <input
                      type="date"
                      required
                      value={expenseForm.date}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, date: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                      Documento
                    </label>
                    <select
                      value={expenseForm.tipoDoc}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, tipoDoc: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                    >
                      <option value="Boleta de Honorarios">Boleta (15,25%)</option>
                      <option value="Factura">Factura</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    Categoría
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, category: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  >
                    {BUDGET_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    Proveedor o Profesional *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Rodrigo Pérez o Rental SpA"
                    value={expenseForm.provider}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, provider: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    Monto Bruto ($ CLP) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    placeholder="Ej: 450000"
                    value={expenseForm.montoBruto}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, montoBruto: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    Detalle (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Jornada cámara / arriendo lentes"
                    value={expenseForm.notes}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, notes: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  />
                </div>

                {/* Resumen de pago líquido */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
                    <span>Retención SII:</span>
                    <span className="font-mono font-medium text-amber-600 dark:text-amber-400">
                      - {formatCLP(previewExpenseTax.retencion)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                    <span>Líquido a pagar:</span>
                    <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      {formatCLP(previewExpenseTax.montoLiquido)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
                >
                  <Plus className="h-4 w-4" />
                  <span>Agregar Gasto</span>
                </button>
              </form>
            </div>
          </div>

          {/* Derecha: Tabla de Gastos */}
          <div className="lg:col-span-8">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Gastos Registrados ({project.expenses?.length || 0})
                </h3>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    Retenciones: {formatCLP(metrics.totalRetencionesBHE)}
                  </span>
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    Líquido pagado: {formatCLP(metrics.totalLiquidoPagado)}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase text-slate-500 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">Proveedor / Detalle</th>
                      <th className="px-4 py-3">Categoría</th>
                      <th className="px-4 py-3">Documento</th>
                      <th className="px-4 py-3 text-right">Bruto</th>
                      <th className="px-4 py-3 text-right">Retención</th>
                      <th className="px-4 py-3 text-right">Líquido</th>
                      <th className="px-3 py-3 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/70">
                    {(project.expenses || []).map((exp) => {
                      const tax = calculateDocumentTax(exp.montoBruto, exp.tipoDoc);
                      const catObj = BUDGET_CATEGORIES.find((c) => c.id === exp.category);
                      const isBHE = exp.tipoDoc === 'Boleta de Honorarios';

                      return (
                        <tr
                          key={exp.id}
                          className="transition hover:bg-slate-50 dark:hover:bg-zinc-800/40"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900 dark:text-zinc-100">
                              {exp.provider}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                              {exp.date} {exp.notes ? `· ${exp.notes}` : ''}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                              {catObj?.label || exp.category}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                                isBHE
                                  ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300'
                                  : 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300'
                              }`}
                            >
                              <FileText className="h-3 w-3" />
                              {isBHE ? 'Boleta' : 'Factura'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                            {formatCLP(tax.montoBruto)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-amber-600 dark:text-amber-400">
                            {isBHE ? `- ${formatCLP(tax.retencion)}` : '$0'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCLP(tax.montoLiquido)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => onDeleteExpense(project.id, exp.id)}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-500 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
                              title="Eliminar gasto"
                              aria-label={`Eliminar gasto de ${exp.provider}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          PESTAÑA 3: REVISIONES DE VIDEO
         ======================================================================= */}
      {activeTab === 'revisiones' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Izquierda: Formulario Nueva Revisión */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Registrar Revisión #{nextRoundNumber}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Vincula el enlace del video y los comentarios del cliente
              </p>

              <form onSubmit={handleRevisionSubmit} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    Link de Video (Vimeo / Drive) *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://vimeo.com/kinok/corte-v3"
                    value={revisionForm.videoUrl}
                    onChange={(e) =>
                      setRevisionForm({ ...revisionForm, videoUrl: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-sky-600 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-sky-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    Comentarios del Cliente *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Cambios solicitados por el cliente..."
                    value={revisionForm.clientFeedback}
                    onChange={(e) =>
                      setRevisionForm({ ...revisionForm, clientFeedback: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    Horas Estimadas de Edición
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={revisionForm.estimatedHours}
                    onChange={(e) =>
                      setRevisionForm({
                        ...revisionForm,
                        estimatedHours: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  />
                </div>

                {/* Switch ¿Fuera de Alcance? */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-white">
                        ¿Fuera de alcance?
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Excede lo contratado originalmente
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={revisionForm.outOfScope}
                      onClick={() =>
                        setRevisionForm({
                          ...revisionForm,
                          outOfScope: !revisionForm.outOfScope,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        revisionForm.outOfScope
                          ? 'bg-amber-500'
                          : 'bg-slate-300 dark:bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                          revisionForm.outOfScope ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
                >
                  <Plus className="h-4 w-4" />
                  <span>Guardar Revisión</span>
                </button>
              </form>
            </div>
          </div>

          {/* Derecha: Historial de Revisiones */}
          <div className="space-y-3 lg:col-span-8">
            {(project.revisions || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
                <Info className="h-7 w-7 text-slate-400 dark:text-zinc-500" />
                <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Sin revisiones registradas
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                  Agrega una ronda cuando envíes un corte de video al cliente.
                </p>
              </div>
            ) : (
              (project.revisions || []).map((rev) => {
                const extraValuation =
                  (Number(rev.estimatedHours) || 0) * (project.extraHourRateCLP || 55000);

                return (
                  <div
                    key={rev.id}
                    className={`rounded-2xl border p-4 shadow-sm transition ${
                      rev.outOfScope
                        ? 'border-amber-300 bg-amber-50/40 dark:border-amber-500/50 dark:bg-amber-950/20'
                        : 'border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-800 dark:bg-zinc-800 dark:text-white">
                          Ronda #{rev.roundNumber}
                        </span>
                        <span className="font-mono text-xs text-slate-400 dark:text-zinc-400">
                          {rev.date}
                        </span>

                        {rev.outOfScope ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-300">
                            <AlertTriangle className="h-3 w-3" />
                            Cobro Adicional
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Incluido
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 dark:text-zinc-300">
                          Fuera de alcance
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={rev.outOfScope}
                          aria-label={`Marcar Ronda #${rev.roundNumber} fuera de alcance`}
                          onClick={() => onToggleRevisionScope(project.id, rev.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                            rev.outOfScope
                              ? 'bg-amber-500'
                              : 'bg-slate-300 dark:bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                              rev.outOfScope ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <p className="mt-2.5 text-xs leading-relaxed text-slate-700 dark:text-zinc-200">
                      &ldquo;{rev.clientFeedback}&rdquo;
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs dark:border-zinc-800">
                      <a
                        href={rev.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-sky-600 hover:underline dark:text-sky-400"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Abrir video de revisión</span>
                      </a>

                      <div className="flex items-center gap-3 text-slate-500 dark:text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {rev.estimatedHours} hrs
                        </span>
                        {rev.outOfScope && (
                          <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                            Extra sugerido: {formatCLP(extraValuation)} + IVA
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

