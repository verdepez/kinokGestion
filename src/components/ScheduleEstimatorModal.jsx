import React, { useState, useMemo } from 'react';
import {
  Clapperboard,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Share2,
  SlidersHorizontal,
  FileDown,
  Send,
  Mail,
  FileCheck2,
} from 'lucide-react';
import NativeModal from './NativeModal';
import {
  PRODUCTION_TYPES,
  PRODUCTION_TYPE_LIST,
  PROJECT_PHASES,
  PHASE_IDS,
  calculatePhaseSchedule,
  addDaysISO,
  parseISODate,
  toISODate,
  formatShortDateES,
  getPhaseMeta,
} from '../utils/scheduleEstimator';
import {
  IVA_RATE,
  BUDGET_CATEGORIES,
  computeProjectMetrics,
  formatCLP,
} from '../utils/finance';
import {
  downloadQuotePdf,
  buildWhatsAppQuoteUrl,
  buildMailtoQuoteUrl,
} from '../utils/pdfQuoteGenerator';

const WEEKDAYS_ES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function buildCalendarDays(year, month) {
  const firstDay = new Date(Date.UTC(year, month, 1, 12, 0, 0));
  const lastDay = new Date(Date.UTC(year, month + 1, 0, 12, 0, 0));
  const daysInMonth = lastDay.getUTCDate();

  // Lunes = 0 ... Domingo = 6
  const startWeekday = (firstDay.getUTCDay() + 6) % 7;
  const cells = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(Date.UTC(year, month, d, 12, 0, 0));
    cells.push({
      day: d,
      iso: toISODate(dt),
    });
  }
  return cells;
}

export default function ScheduleEstimatorModal({
  isOpen,
  onClose,
  onCreateProject,
  onConfirmQuote,
}) {
  const defaultStart = '2026-10-06';
  const defaultType = 'video_corporativo';
  const defaultEnd = addDaysISO(
    defaultStart,
    PRODUCTION_TYPES[defaultType].defaultDays
  );

  const [step, setStep] = useState(1); // 1: Cronograma & Gantt | 2: Lanzamiento y Presupuesto
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [shootLocation, setShootLocation] = useState('Santiago, RM');
  const [projectType, setProjectType] = useState(defaultType);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [customBoundaries, setCustomBoundaries] = useState(null);
  const [distributionPartner, setDistributionPartner] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [quoteValidityDays, setQuoteValidityDays] = useState(15);
  const [quoteNotes, setQuoteNotes] = useState(
    '50% anticipo al aprobar presupuesto y 50% contra entrega de Master.'
  );

  // Estado de la cotización guardada por detrás como proyecto
  const [generatedQuoteProject, setGeneratedQuoteProject] = useState(null);
  const [validationError, setValidationError] = useState('');

  // Control del selector interactivo de rango en el calendario
  const [selectingEdge, setSelectingEdge] = useState('start'); // 'start' | 'end'
  const startDt = parseISODate(startDate);
  const [calendarYear, setCalendarYear] = useState(startDt.getUTCFullYear());
  const [calendarMonth, setCalendarMonth] = useState(startDt.getUTCMonth());

  // Presupuesto y margen comercial
  const [desiredMarginPct, setDesiredMarginPct] = useState(35);
  const [budget, setBudget] = useState({
    personal_tecnico: 2800000,
    equipamiento: 1500000,
    logistica_viaticos: 650000,
    imprevistos_contingencia: 350000,
  });

  // Cálculo reactivo del cronograma, fases, Gantt y alertas de industria
  const schedule = useMemo(
    () =>
      calculatePhaseSchedule({
        startDate,
        endDate,
        projectType,
        customBoundaries,
        referenceDate: '2026-10-06',
      }),
    [startDate, endDate, projectType, customBoundaries]
  );

  const calendarCells = useMemo(
    () => buildCalendarDays(calendarYear, calendarMonth),
    [calendarYear, calendarMonth]
  );

  const [endDateFlash, setEndDateFlash] = useState(false);

  const triggerEndDateHighlight = () => {
    setEndDateFlash(true);
    setTimeout(() => setEndDateFlash(false), 900);
  };

  const syncCalendarToIso = (isoDate) => {
    const dt = parseISODate(isoDate);
    setCalendarYear(dt.getUTCFullYear());
    setCalendarMonth(dt.getUTCMonth());
  };

  // Al seleccionar el Tipo de Producción, recalcular enseguida la Fecha de Entrega / Lanzamiento
  const handleSelectProductionType = (newType) => {
    setProjectType(newType);
    setCustomBoundaries(null);
    const profile = PRODUCTION_TYPES[newType] || PRODUCTION_TYPES.video_corporativo;
    const suggestedEnd = addDaysISO(startDate, profile.defaultDays);
    setEndDate(suggestedEnd);
    triggerEndDateHighlight();
  };

  // Al cambiar la Fecha de Inicio, actualizar dinámicamente la Fecha de Entrega según el Tipo de Producción activo
  const handleStartDateChange = (newStartIso) => {
    if (!newStartIso) return;
    setCustomBoundaries(null);
    setStartDate(newStartIso);
    const profile = PRODUCTION_TYPES[projectType] || PRODUCTION_TYPES.video_corporativo;
    const nextEnd = addDaysISO(newStartIso, profile.defaultDays);
    setEndDate(nextEnd);
    syncCalendarToIso(newStartIso);
    triggerEndDateHighlight();
  };

  const handleApplySuggestedDuration = () => {
    const profile = PRODUCTION_TYPES[projectType] || PRODUCTION_TYPES.video_corporativo;
    setCustomBoundaries(null);
    const suggestedEnd = addDaysISO(startDate, profile.defaultDays);
    setEndDate(suggestedEnd);
    triggerEndDateHighlight();
  };

  const handleCalendarDayClick = (isoDate) => {
    setCustomBoundaries(null);
    if (selectingEdge === 'start') {
      handleStartDateChange(isoDate);
      setSelectingEdge('end');
    } else {
      if (isoDate <= startDate) {
        handleStartDateChange(isoDate);
        setSelectingEdge('end');
      } else {
        setEndDate(isoDate);
        triggerEndDateHighlight();
        setSelectingEdge('start');
      }
    }
  };

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarYear((y) => y - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarYear((y) => y + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleMilestoneDateChange = (field, newIsoDate) => {
    const currentPreEnd = customBoundaries?.preEndDate || schedule.preEndDate;
    const currentProdEnd = customBoundaries?.prodEndDate || schedule.prodEndDate;

    const nextPreEnd = field === 'preEndDate' ? newIsoDate : currentPreEnd;
    const nextProdEnd = field === 'prodEndDate' ? newIsoDate : currentProdEnd;

    setCustomBoundaries({
      preEndDate: nextPreEnd,
      prodEndDate: nextProdEnd,
    });
  };

  const handleNudgeMilestone = (field, deltaDays) => {
    const baseIso =
      field === 'preEndDate' ? schedule.preEndDate : schedule.prodEndDate;
    const nudged = addDaysISO(baseIso, deltaDays);
    handleMilestoneDateChange(field, nudged);
  };

  const getDayPhaseColor = (iso) => {
    if (iso < schedule.startDate || iso > schedule.endDate) return null;
    if (iso === schedule.endDate) return 'DELIVERY_LAUNCH';
    if (iso < schedule.preEndDate) return 'PRE_PRODUCTION';
    if (iso < schedule.prodEndDate) return 'PRODUCTION';
    return 'POST_PRODUCTION';
  };

  const clampedMargin = Math.min(85, Math.max(5, Number(desiredMarginPct) || 35));
  const quoteMetrics = computeProjectMetrics({
    budgetCategories: budget,
    desiredMarginPct: clampedMargin,
  });
  const totalBudget = quoteMetrics.costoDirectoTotal;
  const precioVentaNeto = quoteMetrics.precioVentaNeto;
  const margenComercialCLP = quoteMetrics.margenComercialCLP;
  const ivaDebito = quoteMetrics.ivaDebito;
  const precioVentaBruto = quoteMetrics.precioVentaBruto;

  const buildPayload = () => ({
    existingId: generatedQuoteProject?.id || null,
    existingCode: generatedQuoteProject?.code || null,
    name: name.trim(),
    client: client.trim(),
    shootLocation: shootLocation.trim() || 'Santiago, RM',
    projectType,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
    phase: schedule.inferredPhase,
    daysRemaining: schedule.daysRemaining,
    shootDates: schedule.shootDatesLabel,
    phaseSchedule: schedule,
    distributionPartner: distributionPartner.trim(),
    clientContact: clientContact.trim(),
    quoteValidityDays: Number(quoteValidityDays) || 15,
    quoteNotes: quoteNotes.trim(),
    quoteStatus: 'PENDING_APPROVAL',
    desiredMarginPct: clampedMargin,
    ...budget,
  });

  // Guarda por detrás los datos como proyecto (en estado Cotización Pendiente) y retorna el proyecto creado
  const persistQuoteBehindTheScenes = () => {
    if (!name.trim() || !client.trim()) {
      setValidationError(
        'Por favor ingresa el Nombre del Proyecto y el Cliente / Marca para generar la cotización.'
      );
      setStep(1);
      return null;
    }
    setValidationError('');
    const payload = buildPayload();
    const saved = onCreateProject(payload);
    const projectObj = saved || {
      id: generatedQuoteProject?.id || `PRJ-2026-COT`,
      code: generatedQuoteProject?.code || `KNK-COT`,
      ...payload,
      budgetCategories: { ...budget },
    };
    setGeneratedQuoteProject(projectObj);
    return projectObj;
  };

  // Botón "Generar Cotización" en el Paso 2: guarda por detrás como proyecto y prepara el documento
  const handleGenerateQuote = () => {
    const saved = persistQuoteBehindTheScenes();
    if (!saved) return;
    setStep(2);
  };

  // Botón "Generar PDF Cotización": guarda por detrás como proyecto y descarga el PDF listo para enviar por WhatsApp o Mail
  const handleSubmit = (e) => {
    e.preventDefault();
    const saved = persistQuoteBehindTheScenes();
    if (!saved) return;
    setStep(2);
    downloadQuotePdf(saved);
  };

  const handleResetAndClose = () => {
    setName('');
    setClient('');
    setDistributionPartner('');
    setClientContact('');
    setValidationError('');
    setGeneratedQuoteProject(null);
    setCustomBoundaries(null);
    setStep(1);
    onClose();
  };

  const handleConfirmAndActivateNow = () => {
    const saved = generatedQuoteProject || persistQuoteBehindTheScenes();
    if (!saved) return;
    if (typeof onConfirmQuote === 'function') {
      onConfirmQuote(saved.id);
    }
    handleResetAndClose();
  };

  const inferredPhaseMeta = getPhaseMeta(schedule.inferredPhase);
  const prePhase = schedule.phases.find((p) => p.id === PHASE_IDS.PRE_PRODUCTION);
  const prodPhase = schedule.phases.find((p) => p.id === PHASE_IDS.PRODUCTION);
  const postPhase = schedule.phases.find((p) => p.id === PHASE_IDS.POST_PRODUCTION);
  const activeProfile = PRODUCTION_TYPES[projectType] || PRODUCTION_TYPES.video_corporativo;

  return (
    <NativeModal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title="Cotizar Proyecto"
      subtitle="Estimador dinámico de tiempos, fechas de entrega/lanzamiento y generación de cotización PDF"
      icon={Clapperboard}
      accentColor="emerald"
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {validationError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Indicador de Pasos del Wizard */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-950">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 font-semibold transition ${
              step === 1
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-emerald-500 dark:text-zinc-950'
                : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>1. Identidad, Calendario y Cronograma Gantt</span>
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 font-semibold transition ${
              step === 2
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-emerald-500 dark:text-zinc-950'
                : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>2. Lanzamiento y Presupuesto</span>
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-5">
            {/* Datos de Identidad */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Nombre del Proyecto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Campaña Energías Limpias"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Cliente / Marca *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Colbún S.A."
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Locación Principal
                </label>
                <input
                  type="text"
                  placeholder="Ej: Santiago, RM"
                  value={shootLocation}
                  onChange={(e) => setShootLocation(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />
              </div>
            </div>

            {/* Selector de Tipo de Producción con Fecha de Entrega Dinámica */}
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Tipo de Producción (Actualiza enseguida la Fecha de Entrega / Lanzamiento)
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  Entrega dinámica: {formatShortDateES(schedule.endDate)} ({schedule.totalDays} días)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {PRODUCTION_TYPE_LIST.map((typeItem) => {
                  const isSelected = projectType === typeItem.id;
                  const dynamicDeliveryIso = addDaysISO(startDate, typeItem.defaultDays);
                  return (
                    <button
                      key={typeItem.id}
                      type="button"
                      onClick={() => handleSelectProductionType(typeItem.id)}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500/30 dark:border-emerald-500 dark:bg-emerald-500/15'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800/70'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-1">
                        <span
                          className={`text-xs font-bold ${
                            isSelected
                              ? 'text-emerald-800 dark:text-emerald-300'
                              : 'text-slate-800 dark:text-zinc-200'
                          }`}
                        >
                          {typeItem.label}
                        </span>
                        <span className="rounded bg-emerald-100/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                          +{typeItem.defaultDays}d
                        </span>
                      </div>
                      <span className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">
                        {typeItem.subtitle}
                      </span>
                      <span className="mt-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Entrega: {formatShortDateES(dynamicDeliveryIso)}
                      </span>
                      <span className="mt-1.5 rounded-md bg-white/90 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 dark:bg-zinc-900 dark:text-zinc-300">
                        {Math.round(typeItem.ratios.pre * 100)}% Pre ·{' '}
                        {Math.round(typeItem.ratios.prod * 100)}% Rod ·{' '}
                        {Math.round(typeItem.ratios.post * 100)}% Post
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calendario Interactivo de Rango + Gráfico Gantt */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Columna Izquierda: Date-Range Picker Interactivo Dinámico */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/80 lg:col-span-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    Rango de Fechas Dinámico
                  </span>
                  <button
                    type="button"
                    onClick={handleApplySuggestedDuration}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                    title="Restaurar duración sugerida por tipo de producción"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Sugerido (+{activeProfile.defaultDays}d)</span>
                  </button>
                </div>

                {/* Inputs de Inicio y Fin sincronizados con el Tipo de Producción y Calendario */}
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  <div
                    onClick={() => {
                      setSelectingEdge('start');
                      syncCalendarToIso(startDate);
                    }}
                    className={`cursor-pointer rounded-xl border p-2 transition ${
                      selectingEdge === 'start'
                        ? 'border-emerald-500 bg-white dark:bg-zinc-900'
                        : 'border-slate-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/50'
                    }`}
                  >
                    <label className="block text-[10px] font-semibold uppercase text-slate-500 dark:text-zinc-400">
                      Inicio Preproducción
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="mt-0.5 w-full bg-transparent font-mono text-xs font-semibold text-slate-900 focus:outline-none dark:text-white"
                    />
                    <span className="mt-0.5 block text-[10px] text-slate-500 dark:text-zinc-400">
                      {formatShortDateES(startDate)}
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setSelectingEdge('end');
                      syncCalendarToIso(endDate);
                    }}
                    className={`cursor-pointer rounded-xl border p-2 transition-all duration-300 ${
                      endDateFlash
                        ? 'border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-500/40 dark:bg-emerald-500/20'
                        : selectingEdge === 'end'
                        ? 'border-emerald-500 bg-white dark:bg-zinc-900'
                        : 'border-slate-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                        Entrega / Lanzamiento
                      </label>
                      <span className="rounded bg-emerald-100 px-1 py-0.2 font-mono text-[9px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                        {schedule.totalDays}d
                      </span>
                    </div>
                    <input
                      type="date"
                      value={endDate}
                      min={addDaysISO(startDate, 3)}
                      onChange={(e) => {
                        setCustomBoundaries(null);
                        setEndDate(e.target.value);
                        syncCalendarToIso(e.target.value);
                      }}
                      className="mt-0.5 w-full bg-transparent font-mono text-xs font-bold text-emerald-700 focus:outline-none dark:text-emerald-300"
                    />
                    <span className="mt-0.5 block text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      {formatShortDateES(endDate)}
                    </span>
                  </div>
                </div>

                {/* Navegación del Mes del Calendario + Atajos Inicio/Entrega */}
                <div className="mt-3 flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                    aria-label="Mes anterior"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      {MONTHS_ES[calendarMonth]} {calendarYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => syncCalendarToIso(endDate)}
                      className="rounded-md bg-emerald-100/80 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-200/70 dark:bg-emerald-500/20 dark:text-emerald-300"
                      title="Ver mes de Entrega / Lanzamiento en el calendario"
                    >
                      Ver entrega
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                    aria-label="Mes siguiente"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Grilla de Días del Calendario con Colores por Fase */}
                <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                  {WEEKDAYS_ES.map((wd) => (
                    <span key={wd}>{wd}</span>
                  ))}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {calendarCells.map((cell, idx) => {
                    if (!cell) {
                      return <div key={`empty-${idx}`} className="h-7" />;
                    }
                    const isStart = cell.iso === schedule.startDate;
                    const isEnd = cell.iso === schedule.endDate;
                    const phaseOnDay = getDayPhaseColor(cell.iso);

                    let cellStyle =
                      'text-slate-700 hover:bg-slate-200/70 dark:text-zinc-300 dark:hover:bg-zinc-800';
                    if (isStart || isEnd) {
                      cellStyle =
                        'bg-emerald-600 font-bold text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950';
                    } else if (phaseOnDay === PHASE_IDS.PRE_PRODUCTION) {
                      cellStyle =
                        'bg-sky-100 text-sky-900 font-medium dark:bg-sky-500/20 dark:text-sky-200';
                    } else if (phaseOnDay === PHASE_IDS.PRODUCTION) {
                      cellStyle =
                        'bg-violet-100 text-violet-900 font-semibold dark:bg-violet-500/25 dark:text-violet-200';
                    } else if (phaseOnDay === PHASE_IDS.POST_PRODUCTION) {
                      cellStyle =
                        'bg-indigo-100 text-indigo-900 font-medium dark:bg-indigo-500/20 dark:text-indigo-200';
                    }

                    return (
                      <button
                        key={cell.iso}
                        type="button"
                        onClick={() => handleCalendarDayClick(cell.iso)}
                        className={`flex h-7 items-center justify-center rounded-lg font-mono text-[11px] transition ${cellStyle}`}
                        title={`${cell.iso}${phaseOnDay ? ` (${phaseOnDay})` : ''}`}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>

                <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-zinc-400">
                  Clic para elegir{' '}
                  <strong className="text-slate-700 dark:text-zinc-200">
                    {selectingEdge === 'start' ? 'Fecha de inicio' : 'Fecha de entrega'}
                  </strong>{' '}
                  · Duración total: <strong>{schedule.totalDays} días</strong>
                </p>
              </div>

              {/* Columna Derecha: Gráfico Gantt Interactivo y Ajuste de Hitos */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-7">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        Previsualización de Cronograma (Diagrama Gantt)
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {schedule.shootDatesLabel} ({schedule.totalDays} días calendario)
                      </p>
                    </div>

                    {customBoundaries && (
                      <button
                        type="button"
                        onClick={() => setCustomBoundaries(null)}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Restaurar proporción</span>
                      </button>
                    )}
                  </div>

                  {/* Barra Gantt Proporcional Apilada */}
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-1.5 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex h-8 w-full overflow-hidden rounded-lg">
                      <div
                        style={{ width: `${ Math.max(8, prePhase.percentage) }%` }}
                        className="flex items-center justify-center bg-sky-500 px-2 text-[11px] font-bold text-white transition-all duration-300"
                        title={`Preproducción: ${prePhase.days} días (${prePhase.percentage}%)`}
                      >
                        <span className="truncate">
                          Pre {prePhase.percentage}% ({prePhase.days}d)
                        </span>
                      </div>
                      <div
                        style={{ width: `${ Math.max(8, prodPhase.percentage) }%` }}
                        className="flex items-center justify-center border-x border-white/30 bg-violet-500 px-2 text-[11px] font-bold text-white transition-all duration-300"
                        title={`Producción / Rodaje: ${prodPhase.days} días (${prodPhase.percentage}%)`}
                      >
                        <span className="truncate">
                          Rodaje {prodPhase.percentage}% ({prodPhase.days}d)
                        </span>
                      </div>
                      <div
                        style={{ width: `${ Math.max(8, postPhase.percentage) }%` }}
                        className="flex items-center justify-center bg-indigo-500 px-2 text-[11px] font-bold text-white transition-all duration-300"
                        title={`Postproducción: ${postPhase.days} días (${postPhase.percentage}%)`}
                      >
                        <span className="truncate">
                          Post {postPhase.percentage}% ({postPhase.days}d)
                        </span>
                      </div>
                      <div
                        className="flex w-8 shrink-0 items-center justify-center bg-emerald-500 text-[10px] font-bold text-white"
                        title={`Hito Entrega / Lanzamiento: ${formatShortDateES(
                          schedule.endDate
                        )}`}
                      >
                        ★
                      </div>
                    </div>
                  </div>

                  {/* Filas de Hitos Editables Tipo Gantt */}
                  <div className="mt-3 space-y-2">
                    {/* Hito 1: Preproducción */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Preproducción
                          </span>
                          <span className="ml-2 font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                            {prePhase.days} días ({prePhase.percentage}%)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400">Fin hito:</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeMilestone('preEndDate', -1)}
                          className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[11px] hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900"
                        >
                          -1d
                        </button>
                        <input
                          type="date"
                          value={schedule.preEndDate}
                          min={addDaysISO(schedule.startDate, 1)}
                          max={addDaysISO(schedule.prodEndDate, -1)}
                          onChange={(e) =>
                            handleMilestoneDateChange('preEndDate', e.target.value)
                          }
                          className="rounded-lg border border-slate-300 bg-white px-2 py-0.5 font-mono text-[11px] text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleNudgeMilestone('preEndDate', 1)}
                          className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[11px] hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900"
                        >
                          +1d
                        </button>
                      </div>
                    </div>

                    {/* Hito 2: Producción / Rodaje */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Producción / Rodaje
                          </span>
                          <span className="ml-2 font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                            {prodPhase.days} días ({prodPhase.percentage}%)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400">Fin hito:</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeMilestone('prodEndDate', -1)}
                          className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[11px] hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900"
                        >
                          -1d
                        </button>
                        <input
                          type="date"
                          value={schedule.prodEndDate}
                          min={addDaysISO(schedule.preEndDate, 1)}
                          max={addDaysISO(schedule.endDate, -1)}
                          onChange={(e) =>
                            handleMilestoneDateChange('prodEndDate', e.target.value)
                          }
                          className="rounded-lg border border-slate-300 bg-white px-2 py-0.5 font-mono text-[11px] text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleNudgeMilestone('prodEndDate', 1)}
                          className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[11px] hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900"
                        >
                          +1d
                        </button>
                      </div>
                    </div>

                    {/* Hito 3: Postproducción + Entrega/Lanzamiento */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Postproducción → Entrega / Lanzamiento
                          </span>
                          <span className="ml-2 font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                            {postPhase.days} días ({postPhase.percentage}%)
                          </span>
                        </div>
                      </div>
                      <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        Lanzamiento: {formatShortDateES(schedule.endDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Indicadores de Salud Temporal / Advertencias de Estándar de Industria */}
                <div className="mt-3">
                  {schedule.warnings.length === 0 ? (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          Cronograma balanceado según estándar de industria para{' '}
                          <strong>{schedule.typeLabel}</strong>.
                        </span>
                      </div>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${inferredPhaseMeta.badgeColor}`}
                      >
                        Fase actual: {inferredPhaseMeta.label}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {schedule.warnings.map((w) => (
                        <div
                          key={w.id}
                          className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
                            w.severity === 'critical'
                              ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/40 dark:bg-rose-950/30 dark:text-rose-200'
                              : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-200'
                          }`}
                        >
                          <AlertTriangle
                            className={`mt-0.5 h-4 w-4 shrink-0 ${
                              w.severity === 'critical'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          />
                          <div>
                            <span className="font-bold">{w.title}: </span>
                            <span>{w.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sección Entrega / Lanzamiento y Datos Solicitados de Cotización */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Datos de Lanzamiento y Cotización Comercial
                  </h3>
                </div>
                <span className="rounded-lg bg-emerald-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                  Entrega: {formatShortDateES(schedule.endDate)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
                Completa los datos de entrega/lanzamiento y contacto del cliente para incluirlos en el documento PDF de cotización.
              </p>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Partner de Distribución / Agencia
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Agencia Havas Media / Digital"
                    value={distributionPartner}
                    onChange={(e) => setDistributionPartner(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Correo o WhatsApp Cliente
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: contacto@cliente.cl / +569..."
                    value={clientContact}
                    onChange={(e) => setClientContact(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Validez Cotización (días)
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="90"
                    value={quoteValidityDays}
                    onChange={(e) => setQuoteValidityDays(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Condiciones Comerciales / Observaciones
                </label>
                <input
                  type="text"
                  placeholder="Ej: 50% anticipo al confirmar presupuesto y 50% contra entrega de Master."
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />
              </div>
            </div>

            {/* Presupuesto por Enunciado con Margen Integrado para Negociación */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/70">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    Enunciados de Cotización con Margen Integrado ($ CLP)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    El margen ({clampedMargin}%) se integra directamente en cada enunciado (no como ítem aparte) para que puedas ajustar los costos base y negociar el precio final.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Margen Integrado (%):
                  </label>
                  <div className="flex items-center gap-1">
                    {[25, 30, 35, 40].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDesiredMarginPct(preset)}
                        className={`rounded-lg border px-2 py-1 font-mono text-[11px] font-semibold transition ${
                          desiredMarginPct === preset
                            ? 'border-emerald-500 bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                    <input
                      type="number"
                      min="5"
                      max="80"
                      value={desiredMarginPct}
                      onChange={(e) => setDesiredMarginPct(Number(e.target.value))}
                      className="w-16 rounded-xl border border-slate-300 bg-white px-2 py-1 text-right font-mono text-xs font-bold text-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {quoteMetrics.categoryBreakdown.map((cat) => (
                  <div
                    key={cat.id}
                    className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="block text-xs font-bold text-slate-800 dark:text-zinc-100">
                          {cat.label}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                          {cat.description}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                          Valor Cotizado (c/margen)
                        </span>
                        <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCLP(cat.quotedNet)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 dark:border-zinc-800">
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Costo base:{' '}
                        <strong className="font-mono text-slate-700 dark:text-zinc-300">
                          {formatCLP(cat.budgeted)}
                        </strong>{' '}
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          (+{formatCLP(cat.marginAmount)} margen)
                        </span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setBudget({
                              ...budget,
                              [cat.id]: Math.max(0, (Number(budget[cat.id]) || 0) - 100000),
                            })
                          }
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-600 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          -100k
                        </button>
                        <input
                          type="number"
                          step="50000"
                          min="0"
                          aria-label={`Costo base para ${cat.label}`}
                          value={budget[cat.id]}
                          onChange={(e) =>
                            setBudget({
                              ...budget,
                              [cat.id]: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right font-mono text-xs font-semibold text-slate-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setBudget({
                              ...budget,
                              [cat.id]: (Number(budget[cat.id]) || 0) + 100000,
                            })
                          }
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-600 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          +100k
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen Financiero de Negociación + Botón Generar Cotización */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <span className="block text-[10px] font-medium uppercase text-slate-400">
                      Suma Enunciados (Neto Cliente)
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {formatCLP(precioVentaNeto)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-medium uppercase text-slate-400">
                      IVA Débito (19%)
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      {formatCLP(ivaDebito)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                      Precio Final (c/IVA)
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      {formatCLP(precioVentaBruto)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-medium uppercase text-slate-400">
                      Control Interno Director
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                      Costo: {formatCLP(totalBudget)} · Utilidad: +{formatCLP(margenComercialCLP)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateQuote}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100 dark:border-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-200 dark:hover:bg-emerald-500/30"
                >
                  <FileCheck2 className="h-4 w-4" />
                  <span>
                    {generatedQuoteProject ? 'Actualizar Cotización' : 'Generar Cotización'}
                  </span>
                </button>
              </div>
            </div>

            {/* Tarjeta de Cotización Generada y Lista para Enviar por WhatsApp o Mail */}
            {generatedQuoteProject && (
              <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/80 p-4 shadow-sm dark:border-emerald-500/70 dark:bg-emerald-950/30">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Cotización {generatedQuoteProject.code} guardada como proyecto
                        </h4>
                        <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-200">
                          Pendiente de Confirmación
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-zinc-300">
                        El documento está listo para enviar por <strong>WhatsApp</strong> o{' '}
                        <strong>Correo</strong>. Cuando el cliente apruebe el presupuesto, confírmalo en la plataforma para activarlo en los flujos de trabajo.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-200/80 pt-3 dark:border-emerald-800/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadQuotePdf(generatedQuoteProject)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      <span>Descargar PDF</span>
                    </button>

                    <a
                      href={buildWhatsAppQuoteUrl(generatedQuoteProject)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Enviar por WhatsApp</span>
                    </a>

                    <a
                      href={buildMailtoQuoteUrl(generatedQuoteProject)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>Enviar por Mail</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmAndActivateNow}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-400 dark:bg-zinc-900 dark:text-emerald-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Confirmar Presupuesto y Activar Flujo Ahora</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botonera Inferior del Wizard */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-zinc-800">
          <div className="text-xs text-slate-500 dark:text-zinc-400">
            Fase inicial al confirmar:{' '}
            <strong className="text-slate-800 dark:text-zinc-200">
              {inferredPhaseMeta.label}
            </strong>{' '}
            · Total c/IVA:{' '}
            <strong className="font-mono text-emerald-700 dark:text-emerald-400">
              {formatCLP(precioVentaBruto)}
            </strong>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetAndClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {generatedQuoteProject ? 'Cerrar (Dejar en Cotizaciones)' : 'Cancelar'}
            </button>

            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
              >
                Configurar Lanzamiento y Presupuesto →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-300"
              >
                ← Volver al Gantt
              </button>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
            >
              <FileDown className="h-4 w-4" />
              <span>Generar PDF Cotización</span>
            </button>
          </div>
        </div>
      </form>
    </NativeModal>
  );
}

