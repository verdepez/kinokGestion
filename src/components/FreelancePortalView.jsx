import React, { useState } from 'react';
import {
  Lock,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Upload,
  FileText,
  ExternalLink,
  FileCheck2,
  Plus,
} from 'lucide-react';
import {
  calculateDocumentTax,
  formatCLP,
  RETENCION_BHE_2026,
} from '../utils/finance';
import { USERS } from '../data/mockData';
import NativeModal from './NativeModal';

export default function FreelancePortalView({
  projects,
  onUpdateTaskStatus,
  onSubmitFreelanceBoleta,
  onTriggerForbiddenRoute,
}) {
  const freelancer = USERS.freelance;

  const assignedProjects = projects.filter((p) =>
    (p.assignedFreelancers || []).includes(freelancer.id)
  );

  const [isBoletaModalOpen, setIsBoletaModalOpen] = useState(false);
  const [boletaForm, setBoletaForm] = useState({
    projectId: assignedProjects[0]?.id || 'PRJ-2026-01',
    tipoDoc: 'Boleta de Honorarios',
    folioSII: 'BHE-2026-0089',
    montoBruto: 650000,
    concepto: 'Jornada Dirección de Fotografía / Etalonaje',
    pdfFileName: 'Boleta_89_CamilaValdes.pdf',
  });
  const [lastSubmittedReceipt, setLastSubmittedReceipt] = useState(null);

  const taxPreview = calculateDocumentTax(
    Number(boletaForm.montoBruto) || 0,
    boletaForm.tipoDoc
  );

  const mySubmittedBoletas = assignedProjects.flatMap((proj) =>
    (proj.expenses || [])
      .filter(
        (exp) =>
          exp.provider.toLowerCase().includes('camila valdés') ||
          exp.submittedBy === freelancer.name
      )
      .map((exp) => ({
        ...exp,
        projectName: proj.name,
        projectCode: proj.code,
      }))
  );

  const handleOpenBoletaForProject = (projectId) => {
    setBoletaForm((prev) => ({
      ...prev,
      projectId,
      folioSII: `BHE-2026-00${Math.floor(90 + Math.random() * 90)}`,
    }));
    setIsBoletaModalOpen(true);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBoletaForm((prev) => ({ ...prev, pdfFileName: file.name }));
    }
  };

  const handleBoletaSubmit = (e) => {
    e.preventDefault();
    const bruto = Number(boletaForm.montoBruto);
    if (!bruto || bruto <= 0) return;

    const targetProject = assignedProjects.find((p) => p.id === boletaForm.projectId);
    onSubmitFreelanceBoleta(boletaForm.projectId, {
      date: '2026-09-30',
      category: 'personal_tecnico',
      provider: `${freelancer.name} (${boletaForm.folioSII})`,
      tipoDoc: 'Boleta de Honorarios',
      montoBruto: Math.round(bruto),
      notes: `${boletaForm.concepto} · PDF: ${boletaForm.pdfFileName}`,
      submittedBy: freelancer.name,
    });

    setLastSubmittedReceipt({
      folio: boletaForm.folioSII,
      projectName: targetProject?.name || boletaForm.projectId,
      bruto: taxPreview.montoBruto,
      retencion: taxPreview.retencion,
      liquido: taxPreview.montoLiquido,
    });

    setIsBoletaModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Simple del Portal Freelance */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Hola, {freelancer.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {freelancer.position} · Tus tareas asignadas y envío de boletas de honorarios
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onTriggerForbiddenRoute}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Ir a /admin/finanzas</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBoletaModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-400 dark:bg-amber-400 dark:text-zinc-950"
          >
            <Upload className="h-4 w-4" />
            <span>Subir Boleta de Honorarios</span>
          </button>
        </div>
      </div>

      {/* Confirmación si acaba de subir una Boleta */}
      {lastSubmittedReceipt && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs dark:border-emerald-500/40 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                Boleta {lastSubmittedReceipt.folio} enviada a {lastSubmittedReceipt.projectName}
              </p>
              <p className="text-slate-600 dark:text-zinc-300">
                Bruto: {formatCLP(lastSubmittedReceipt.bruto)} · Retención (15,25%): -
                {formatCLP(lastSubmittedReceipt.retencion)} ·{' '}
                <strong className="text-emerald-700 dark:text-emerald-300">
                  Líquido a recibir: {formatCLP(lastSubmittedReceipt.liquido)}
                </strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Proyectos y Tareas Asignadas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {assignedProjects.map((project) => {
          const myTasks = (project.freelanceTasks || []).filter(
            (t) => t.assigneeId === freelancer.id
          );

          return (
            <div
              key={project.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {project.code}
                    </span>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                      {project.phase}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenBoletaForProject(project.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Cargar Boleta</span>
                  </button>
                </div>

                <h2 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                  {project.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Cliente: {project.client}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-zinc-950/70 dark:text-zinc-300">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    {project.shootDates}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    {project.shootLocation}
                  </span>
                </div>

                {/* Lista de Tareas */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                    Mis Tareas ({myTasks.length})
                  </p>
                  {myTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                            {task.title}
                          </p>
                          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400">
                            <Clock className="h-3 w-3" />
                            Entrega: {task.dueDate}
                          </span>
                        </div>

                        <select
                          aria-label={`Estado de ${task.title}`}
                          value={task.status}
                          onChange={(e) =>
                            onUpdateTaskStatus(project.id, task.id, e.target.value)
                          }
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none ${
                            task.status === 'Entregado'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300'
                              : task.status === 'En Curso'
                              ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300'
                              : 'border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
                          }`}
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="En Curso">En Curso</option>
                          <option value="Entregado">Entregado</option>
                        </select>
                      </div>

                      {task.externalRefUrl && (
                        <div className="mt-2 border-t border-slate-200/70 pt-1.5 dark:border-zinc-800">
                          <a
                            href={task.externalRefUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 hover:underline dark:text-sky-400"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Abrir carpeta de trabajo</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabla de Mis Boletas Enviadas */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Mis Boletas de Honorarios ({mySubmittedBoletas.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Retención legal del 15,25% calculada automáticamente
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase text-slate-500 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Proyecto</th>
                <th className="px-4 py-3">Folio / Detalle</th>
                <th className="px-4 py-3 text-right">Bruto</th>
                <th className="px-4 py-3 text-right">Retención (15,25%)</th>
                <th className="px-4 py-3 text-right">Líquido a Recibir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/70">
              {mySubmittedBoletas.map((item) => {
                const tax = calculateDocumentTax(item.montoBruto, 'Boleta de Honorarios');
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-zinc-800/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-500 dark:text-zinc-300">
                      {item.date}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-zinc-200">
                      {item.projectName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-zinc-100">
                        {item.provider}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {item.notes}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      {formatCLP(tax.montoBruto)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-amber-600 dark:text-amber-400">
                      - {formatCLP(tax.retencion)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCLP(tax.montoLiquido)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Subir Boleta */}
      <NativeModal
        isOpen={isBoletaModalOpen}
        onClose={() => setIsBoletaModalOpen(false)}
        title="Subir Boleta de Honorarios"
        subtitle="Cálculo automático de retención SII (15,25%)"
        icon={FileText}
        accentColor="amber"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleBoletaSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
              Proyecto *
            </label>
            <select
              value={boletaForm.projectId}
              onChange={(e) =>
                setBoletaForm({ ...boletaForm, projectId: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            >
              {assignedProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                Folio Boleta *
              </label>
              <input
                type="text"
                required
                value={boletaForm.folioSII}
                onChange={(e) =>
                  setBoletaForm({ ...boletaForm, folioSII: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                Monto Bruto ($ CLP) *
              </label>
              <input
                type="number"
                required
                min="10000"
                step="5000"
                value={boletaForm.montoBruto}
                onChange={(e) =>
                  setBoletaForm({ ...boletaForm, montoBruto: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
              Concepto *
            </label>
            <input
              type="text"
              required
              value={boletaForm.concepto}
              onChange={(e) =>
                setBoletaForm({ ...boletaForm, concepto: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            />
          </div>

          {/* Resumen de Retención 15,25% */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between text-slate-600 dark:text-zinc-300">
              <span>Monto Bruto:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {formatCLP(taxPreview.montoBruto)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-amber-700 dark:text-amber-400">
              <span>
                Retención SII ({(RETENCION_BHE_2026 * 100).toFixed(2).replace('.', ',')}%):
              </span>
              <span className="font-mono font-semibold">
                - {formatCLP(taxPreview.retencion)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900 dark:border-zinc-800 dark:text-white">
              <span>Líquido a recibir:</span>
              <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                {formatCLP(taxPreview.montoLiquido)}
              </span>
            </div>
          </div>

          {/* Adjunto PDF */}
          <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 dark:border-zinc-700 dark:bg-zinc-950/70">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-500" />
              <span className="font-mono text-xs text-slate-700 dark:text-zinc-300">
                {boletaForm.pdfFileName}
              </span>
            </div>
            <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              <span>Cambiar PDF</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsBoletaModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-400 dark:bg-amber-400 dark:text-zinc-950"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Enviar Boleta</span>
            </button>
          </div>
        </form>
      </NativeModal>
    </div>
  );
}

