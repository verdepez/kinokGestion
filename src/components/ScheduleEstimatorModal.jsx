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
import { formatCLP } from '../utils/finance';

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
}) {
  const defaultStart = '2026-10-06';
  const defaultType = 'video_corporativo';
  const defaultEnd = addDaysISO(
    defaultStart,
    PRODUCTION_TYPES[defaultType].defaultDays
  );

  const [step, setStep] = useState(1); // 1: Cronograma & Gantt | 2: Presupuesto & Lanzamiento
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [shootLocation, setShootLocation] = useState('Santiago, RM');
  const [projectType, setProjectType] = useState(defaultType);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [customBoundaries, setCustomBoundaries] = useState(null);
  const [distributionPartner, setDistributionPartner] = useState('');

  // Control del selector interactivo de rango en el calendario
  const [selectingEdge, setSelectingEdge] = useState('start'); // 'start' | 'end'
  const startDt = parseISODate(startDate);
  const [calendarYear, setCalendarYear] = useState(startDt.getUTCFullYear());
  const [calendarMonth, setCalendarMonth] = useState(startDt.getUTCMonth());

  // Presupuesto inicial
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

  const handleSelectProductionType = (newType) => {
    setProjectType(newType);
    setCustomBoundaries(null);
    const profile = PRODUCTION_TYPES[newType] || PRODUCTION_TYPES.video_corporativo;
    const suggestedEnd = addDaysISO(startDate, profile.defaultDays);
    setEndDate(suggestedEnd);
  };

  const handleApplySuggestedDuration = () => {
    const profile = PRODUCTION_TYPES[projectType] || PRODUCTION_TYPES.video_corporativo;
    setCustomBoundaries(null);
    setEndDate(addDaysISO(startDate, profile.defaultDays));
  };

  const handleCalendarDayClick = (isoDate) => {
    setCustomBoundaries(null);
    if (selectingEdge === 'start') {
      setStartDate(isoDate);
      if (isoDate >= endDate) {
        const profile = PRODUCTION_TYPES[projectType] || PRODUCTION_TYPES.video_corporativo;
        setEndDate(addDaysISO(isoDate, profile.defaultDays));
      }
      setSelectingEdge('end');
    } else {
      if (isoDate <= startDate) {
        setStartDate(isoDate);
        setSelectingEdge('end');
      } else {
        setEndDate(isoDate);
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

  const totalBudget =
    (Number(budget.personal_tecnico) || 0) +
    (Number(budget.equipamiento) || 0) +
    (Number(budget.logistica_viaticos) || 0) +
    (Number(budget.imprevistos_contingencia) || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !client.trim()) return;

    onCreateProject({
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
      desiredMarginPct: Number(desiredMarginPct) || 35,
      ...budget,
    });

    // Reset y cerrar
    setName('');
    setClient('');
    setDistributionPartner('');
    setCustomBoundaries(null);
    setStep(1);
    onClose();
  };

  const inferredPhaseMeta = getPhaseMeta(schedule.inferredPhase);
  const prePhase = schedule.phases.find((p) => p.id === PHASE_IDS.PRE_PRODUCTION);
  const prodPhase = schedule.phases.find((p) => p.id === PHASE_IDS.PRODUCTION);
  const postPhase = schedule.phases.find((p) => p.id === PHASE_IDS.POST_PRODUCTION);

  return (
    <NativeModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Proyecto y Estimador de Cronograma"
      subtitle="Planifica fechas, previsualiza el diagrama Gantt por fases y valida tiempos de producción"
      icon={Clapperboard}
      accentColor="emerald"
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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
            <span>2. Lanzamiento y Presupuesto Base</span>
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

            {/* Selector de Tipo de Producción */}
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Tipo de Producción (Motor de Estimación Proporcional)
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  Distribuye automáticamente Pre, Rodaje y Post
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {PRODUCTION_TYPE_LIST.map((typeItem) => {
                  const isSelected = projectType === typeItem.id;
                  return (
                    <button
                      key={typeItem.id}
                      type="button"
                      onClick={() => handleSelectProductionType(typeItem.id)}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-sm dark:border-emerald-500 dark:bg-emerald-500/15'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800/70'
                      }`}
                    >
                      <span
                        className={`text-xs font-bold ${
                          isSelected
                            ? 'text-emerald-800 dark:text-emerald-300'
                            : 'text-slate-800 dark:text-zinc-200'
                        }`}
                      >
                        {typeItem.label}
                      </span>
                      <span className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">
                        {typeItem.subtitle}
                      </span>
                      <span className="mt-2 rounded-md bg-white/90 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 dark:bg-zinc-900 dark:text-zinc-300">
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
              {/* Columna Izquierda: Date-Range Picker Interactivo */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/80 lg:col-span-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    Rango de Fechas
                  </span>
                  <button
                    type="button"
                    onClick={handleApplySuggestedDuration}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                    title="Aplicar duración sugerida por estándar"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Sugerido ({PRODUCTION_TYPES[projectType].defaultDays}d)</span>
                  </button>
                </div>

                {/* Inputs de Inicio y Fin sincronizados con el calendario */}
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setSelectingEdge('start')}
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
                      onChange={(e) => {
                        setCustomBoundaries(null);
                        setStartDate(e.target.value);
                        if (e.target.value >= endDate) {
                          setEndDate(addDaysISO(e.target.value, 14));
                        }
                      }}
                      className="mt-0.5 w-full bg-transparent font-mono text-xs font-semibold text-slate-900 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div
                    onClick={() => setSelectingEdge('end')}
                    className={`cursor-pointer rounded-xl border p-2 transition ${
                      selectingEdge === 'end'
                        ? 'border-emerald-500 bg-white dark:bg-zinc-900'
                        : 'border-slate-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/50'
                    }`}
                  >
                    <label className="block text-[10px] font-semibold uppercase text-slate-500 dark:text-zinc-400">
                      Entrega / Lanzamiento
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={addDaysISO(startDate, 3)}
                      onChange={(e) => {
                        setCustomBoundaries(null);
                        setEndDate(e.target.value);
                      }}
                      className="mt-0.5 w-full bg-transparent font-mono text-xs font-semibold text-slate-900 focus:outline-none dark:text-white"
                    />
                  </div>
                </div>

                {/* Navegación del Mes del Calendario */}
                <div className="mt-3 flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                    aria-label="Mes anterior"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                    {MONTHS_ES[calendarMonth]} {calendarYear}
                  </span>
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
            {/* Sección Entrega / Lanzamiento y Partner de Distribución */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Hito de Entrega / Lanzamiento (`DELIVERY_LAUNCH`)
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
                Asocia opcionalmente el Partner de Distribución, canal de exhibición o Agencia de Lanzamiento para la entrega del{' '}
                <strong>{formatShortDateES(schedule.endDate)}</strong>.
              </p>
              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Partner de Distribución / Agencia de Lanzamiento (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Agencia Havas Media / Circuito Festivales / Distribución Digital"
                  value={distributionPartner}
                  onChange={(e) => setDistributionPartner(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />
              </div>
            </div>

            {/* Presupuesto Base por Categoría */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/70">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    Presupuesto Directo por Partida ($ CLP)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Costo directo total estimado:{' '}
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {formatCLP(totalBudget)}
                    </strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Margen Comercial (%):
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="80"
                    value={desiredMarginPct}
                    onChange={(e) => setDesiredMarginPct(Number(e.target.value))}
                    className="w-20 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-right font-mono text-xs font-bold text-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-zinc-400">
                    Personal Técnico
                  </label>
                  <input
                    type="number"
                    step="50000"
                    min="0"
                    value={budget.personal_tecnico}
                    onChange={(e) =>
                      setBudget({
                        ...budget,
                        personal_tecnico: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-zinc-400">
                    Equipamiento (Cámara, Ópticas, Luz)
                  </label>
                  <input
                    type="number"
                    step="50000"
                    min="0"
                    value={budget.equipamiento}
                    onChange={(e) =>
                      setBudget({
                        ...budget,
                        equipamiento: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-zinc-400">
                    Logística / Viáticos
                  </label>
                  <input
                    type="number"
                    step="50000"
                    min="0"
                    value={budget.logistica_viaticos}
                    onChange={(e) =>
                      setBudget({
                        ...budget,
                        logistica_viaticos: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-zinc-400">
                    Imprevistos / Contingencia
                  </label>
                  <input
                    type="number"
                    step="50000"
                    min="0"
                    value={budget.imprevistos_contingencia}
                    onChange={(e) =>
                      setBudget({
                        ...budget,
                        imprevistos_contingencia: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botonera Inferior del Wizard */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-zinc-800">
          <div className="text-xs text-slate-500 dark:text-zinc-400">
            Fase asignada automáticamente:{' '}
            <strong className="text-slate-800 dark:text-zinc-200">
              {inferredPhaseMeta.label}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancelar
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
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
            >
              Confirmar y Crear Proyecto
            </button>
          </div>
        </div>
      </form>
    </NativeModal>
  );
}

