import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calculator,
  Briefcase,
  Lock,
  ShieldAlert,
  ShieldCheck,
  X,
  RotateCcw,
} from 'lucide-react';
import { INITIAL_PROJECTS, INITIAL_AUDIT_LOGS, USERS } from './data/mockData';
import TopBarRoleSelector from './components/TopBarRoleSelector';
import DirectorDashboard from './components/DirectorDashboard';
import ProjectDetailView from './components/ProjectDetailView';
import FreelancePortalView from './components/FreelancePortalView';
import NativeModal from './components/NativeModal';

export default function App() {
  // Tema visual: 'light' por defecto con opción de 'dark'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kinok-theme-mode');
      return saved === 'dark' ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const metaScheme = document.querySelector('meta[name="color-scheme"]');
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
      root.style.colorScheme = 'dark';
      if (metaScheme) metaScheme.content = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.remove('dark');
      body.classList.add('light');
      root.style.colorScheme = 'light';
      if (metaScheme) metaScheme.content = 'light';
    }
    localStorage.setItem('kinok-theme-mode', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Rol RBAC activo ('director' | 'freelance')
  const [currentRole, setCurrentRole] = useState('director');

  // Vista activa ('dashboard' | 'project-detail' | 'freelance-portal')
  const [activeView, setActiveView] = useState('dashboard');

  // Proyecto seleccionado para Detalle de Proyecto
  const [selectedProjectId, setSelectedProjectId] = useState(INITIAL_PROJECTS[0].id);

  // Estado React en vivo de todos los proyectos de Kinok
  const [projects, setProjects] = useState(INITIAL_PROJECTS);

  // Registro de auditoría RBAC en vivo
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);

  // Indicador de conexión a PostgreSQL
  const [dbConnected, setDbConnected] = useState(false);

  // Cargar datos desde PostgreSQL al iniciar
  useEffect(() => {
    fetch('/api/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setDbConnected(Boolean(data.dbConnected));
          if (Array.isArray(data.projects) && data.projects.length > 0) {
            setProjects(data.projects);
          }
          if (Array.isArray(data.auditLogs) && data.auditLogs.length > 0) {
            setAuditLogs(data.auditLogs);
          }
        }
      })
      .catch(() => {
        setDbConnected(false);
      });
  }, []);

  const updateProjectsAndSync = (updater) => {
    setProjects((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: next }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.dbConnected === 'boolean') {
            setDbConnected(data.dbConnected);
          }
        })
        .catch(() => {});
      return next;
    });
  };

  // Modal y Toast de error HTTP 403 Forbidden (RBAC)
  const [forbiddenErrorModalOpen, setForbiddenErrorModalOpen] = useState(false);
  const [forbiddenToast, setForbiddenToast] = useState(null);

  // Modal de Auditoría RBAC para el Director
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const appendAuditLog = (actor, action, status = '200 OK', severity = 'info') => {
    const now = new Date();
    const timeStr = `2026-09-30 ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newLog = {
      id: `AUD-${Date.now()}`,
      timestamp: timeStr,
      actor,
      action,
      status,
      severity,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log: newLog }),
    }).catch(() => {});
  };

  // Cambio instantáneo de Rol
  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole);
    if (newRole === 'freelance') {
      setActiveView('freelance-portal');
      appendAuditLog(
        'Sistema RBAC',
        'Sesión cambiada a Colaborador Freelance (Camila Valdés)',
        'RESTRINGIDO',
        'info'
      );
    } else {
      setActiveView('dashboard');
      appendAuditLog(
        'Sistema RBAC',
        'Sesión cambiada a Director (Nicolás Iriarte)',
        '200 OK',
        'success'
      );
    }
  };

  // Simulador de Ruta Prohibida (/admin/finanzas) -> HTTP 403 Forbidden
  const handleTriggerForbiddenRoute = (attemptedPath = '/admin/finanzas') => {
    const user = USERS[currentRole];
    appendAuditLog(
      `${user.name} (${user.roleLabel})`,
      `Acceso bloqueado a ruta restringida ${attemptedPath}`,
      '403 FORBIDDEN',
      'danger'
    );
    setForbiddenToast({
      code: 'HTTP 403',
      message: `Acceso denegado a ${attemptedPath}`,
      timestamp: new Date().toLocaleTimeString('es-CL'),
    });
    setForbiddenErrorModalOpen(true);
  };

  // Seleccionar un proyecto desde el Kanban para abrir su detalle
  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    setActiveView('project-detail');
  };

  // Mover proyecto de fase
  const handleMoveProjectPhase = (projectId, newPhase) => {
    updateProjectsAndSync((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              phase: newPhase,
              daysRemaining: newPhase === 'Cerrado' ? 0 : p.daysRemaining || 7,
            }
          : p
      )
    );
    appendAuditLog(
      'Nicolás Iriarte',
      `Proyecto ${projectId} movido a "${newPhase}"`,
      '200 OK',
      'info'
    );
  };

  // Crear nuevo proyecto en Kanban
  const handleCreateProject = (formData) => {
    const nextIdx = projects.length + 1;
    const newId = `PRJ-2026-0${nextIdx}`;
    const newCode = `KNK-260${nextIdx}`;
    const newProject = {
      id: newId,
      code: newCode,
      name: formData.name,
      client: formData.client,
      phase: formData.phase,
      daysRemaining: Number(formData.daysRemaining) || 15,
      shootLocation: formData.shootLocation || 'Santiago, RM',
      shootDates: '02 Oct – 25 Oct 2026',
      desiredMarginPct: Number(formData.desiredMarginPct) || 35,
      extraHourRateCLP: 55000,
      assignedFreelancers: ['usr-camila'],
      budgetCategories: {
        personal_tecnico: Number(formData.personal_tecnico) || 2500000,
        equipamiento: Number(formData.equipamiento) || 1500000,
        logistica_viaticos: Number(formData.logistica_viaticos) || 600000,
        imprevistos_contingencia: Number(formData.imprevistos_contingencia) || 300000,
      },
      expenses: [],
      revisions: [],
      freelanceTasks: [
        {
          id: `TSK-${Date.now()}`,
          assigneeId: 'usr-camila',
          title: 'Propuesta de Fotografía y Scouting Técnico Inicial',
          dueDate: '2026-10-10',
          milestone: 'Preproducción',
          status: 'Pendiente',
          externalRefUrl: 'https://drive.google.com/drive/folders/kinok-nuevo-proyecto',
        },
      ],
    };

    updateProjectsAndSync((prev) => [newProject, ...prev]);
    setSelectedProjectId(newId);
    appendAuditLog(
      'Nicolás Iriarte',
      `Nuevo proyecto creado: ${formData.name}`,
      '201 CREATED',
      'success'
    );
  };

  // Actualizar monto presupuestado de una partida
  const handleUpdateBudgetCategory = (projectId, categoryId, newAmount) => {
    updateProjectsAndSync((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              budgetCategories: {
                ...p.budgetCategories,
                [categoryId]: newAmount,
              },
            }
          : p
      )
    );
  };

  // Actualizar Margen Deseado (%)
  const handleUpdateMargin = (projectId, newMarginPct) => {
    updateProjectsAndSync((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              desiredMarginPct: newMarginPct,
            }
          : p
      )
    );
  };

  // Agregar Gasto Real o Boleta desde Portal Freelance
  const handleAddExpense = (projectId, expenseData) => {
    const newExpense = {
      id: `EXP-${Date.now()}`,
      ...expenseData,
    };

    updateProjectsAndSync((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              expenses: [newExpense, ...(p.expenses || [])],
            }
          : p
      )
    );

    appendAuditLog(
      expenseData.submittedBy || 'Nicolás Iriarte',
      `Gasto registrado (${expenseData.tipoDoc}) por $${expenseData.montoBruto.toLocaleString(
        'es-CL'
      )}`,
      '201 CREATED',
      'success'
    );
  };

  // Eliminar Gasto Real
  const handleDeleteExpense = (projectId, expenseId) => {
    updateProjectsAndSync((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              expenses: (p.expenses || []).filter((e) => e.id !== expenseId),
            }
          : p
      )
    );
  };

  // Alternar Switch "¿Fuera de Alcance?"
  const handleToggleRevisionScope = (projectId, revisionId) => {
    updateProjectsAndSync((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          revisions: (p.revisions || []).map((r) =>
            r.id === revisionId ? { ...r, outOfScope: !r.outOfScope } : r
          ),
        };
      })
    );
  };

  // Agregar nueva ronda de revisión
  const handleAddRevision = (projectId, revData) => {
    updateProjectsAndSync((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const nextRound = (p.revisions?.length || 0) + 1;
        const newRevision = {
          id: `REV-${Date.now()}`,
          roundNumber: nextRound,
          date: '2026-09-30',
          platform: 'Vimeo PRO',
          ...revData,
        };
        return {
          ...p,
          revisions: [...(p.revisions || []), newRevision],
        };
      })
    );
  };

  // Actualizar estado de tarea desde Portal Freelance
  const handleUpdateTaskStatus = (projectId, taskId, newStatus) => {
    updateProjectsAndSync((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          freelanceTasks: (p.freelanceTasks || []).map((t) =>
            t.id === taskId ? { ...t, status: newStatus } : t
          ),
        };
      })
    );
    appendAuditLog(
      'Camila Valdés',
      `Tarea actualizada a "${newStatus}"`,
      '200 OK',
      'info'
    );
  };

  // Restaurar datos iniciales de demostración
  const handleResetDemoData = () => {
    setProjects(INITIAL_PROJECTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setForbiddenToast(null);
    fetch('/api/reset', { method: 'POST' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.dbConnected === 'boolean') {
          setDbConnected(data.dbConnected);
        }
      })
      .catch(() => {});
  };

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0];

  const isDirector = currentRole === 'director';

  return (
    <div
      className={`${
        theme === 'dark' ? 'dark bg-zinc-950 text-zinc-100' : 'light bg-slate-50 text-slate-900'
      } min-h-screen transition-colors flex flex-col`}
    >
      {/* Barra Superior con Selector de Rol y Tema Claro/Oscuro */}
      <TopBarRoleSelector
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onTriggerForbiddenRoute={() => handleTriggerForbiddenRoute('/admin/finanzas')}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        auditCount={auditLogs.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Sub-navegación limpia e intuitiva */}
      <div className="border-b border-slate-200 bg-white dark:border-zinc-800/80 dark:bg-zinc-900/60">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
          {isDirector ? (
            <nav className="flex flex-wrap items-center gap-1.5" aria-label="Navegación principal">
              <button
                type="button"
                onClick={() => setActiveView('dashboard')}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  activeView === 'dashboard'
                    ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Panel de Proyectos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('project-detail')}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  activeView === 'project-detail'
                    ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white'
                }`}
              >
                <Calculator className="h-4 w-4" />
                <span>Presupuesto y Gastos</span>
                <span
                  className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${
                    activeView === 'project-detail'
                      ? 'bg-white/20 text-white dark:bg-zinc-950/20 dark:text-zinc-950'
                      : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {selectedProject.code}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('freelance-portal')}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                  activeView === 'freelance-portal'
                    ? 'bg-amber-500 text-white font-semibold dark:bg-amber-400 dark:text-zinc-950'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Briefcase className="h-4 w-4" />
                <span>Vista Freelance</span>
              </button>
            </nav>
          ) : (
            <nav className="flex flex-wrap items-center gap-2" aria-label="Navegación Freelance">
              <span className="flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white dark:bg-amber-400 dark:text-zinc-950">
                <Briefcase className="h-4 w-4" />
                <span>Mis Tareas y Boletas</span>
              </span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                Módulos de finanzas y márgenes están ocultos para este rol.
              </span>
            </nav>
          )}

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-medium ${
                dbConnected
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
              }`}
              title={
                dbConnected
                  ? 'Conectado a PostgreSQL en Railway'
                  : 'Ejecutando en memoria local (sin DATABASE_URL)'
              }
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  dbConnected ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              {dbConnected ? 'PostgreSQL Activo' : 'Memoria Local'}
            </span>

            <button
              type="button"
              onClick={handleResetDemoData}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restaurar demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Flotante de Seguridad RBAC */}
      {forbiddenToast && (
        <div
          role="alert"
          className="fixed bottom-5 right-5 z-40 flex max-w-sm items-start gap-3 rounded-2xl border border-rose-300 bg-white p-4 text-xs shadow-xl dark:border-rose-500/60 dark:bg-zinc-900"
        >
          <ShieldAlert className="h-5 w-5 shrink-0 text-rose-500" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-rose-100 px-1.5 py-0.5 font-mono font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                {forbiddenToast.code}
              </span>
              <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-400">
                {forbiddenToast.timestamp}
              </span>
            </div>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {forbiddenToast.message}
            </p>
            <p className="mt-0.5 text-slate-500 dark:text-zinc-400">
              El rol Freelance no tiene acceso a las finanzas globales.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForbiddenToast(null)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Cerrar alerta"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Área de Contenido Principal */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6">
        {currentRole === 'freelance' || activeView === 'freelance-portal' ? (
          <FreelancePortalView
            projects={projects}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onSubmitFreelanceBoleta={handleAddExpense}
            onTriggerForbiddenRoute={() => handleTriggerForbiddenRoute('/admin/finanzas')}
          />
        ) : activeView === 'project-detail' ? (
          <ProjectDetailView
            project={selectedProject}
            allProjects={projects}
            onSelectProject={handleSelectProject}
            onBackToDashboard={() => setActiveView('dashboard')}
            onUpdateBudgetCategory={handleUpdateBudgetCategory}
            onUpdateMargin={handleUpdateMargin}
            onUpdatePhase={handleMoveProjectPhase}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            onToggleRevisionScope={handleToggleRevisionScope}
            onAddRevision={handleAddRevision}
          />
        ) : (
          <DirectorDashboard
            projects={projects}
            onSelectProject={handleSelectProject}
            onMoveProjectPhase={handleMoveProjectPhase}
            onCreateProject={handleCreateProject}
          />
        )}
      </main>

      {/* Modal HTTP 403 Forbidden Simplificado */}
      <NativeModal
        isOpen={forbiddenErrorModalOpen}
        onClose={() => setForbiddenErrorModalOpen(false)}
        title="Acceso Restringido (Error 403)"
        subtitle="Control de permisos por rol"
        icon={ShieldAlert}
        accentColor="rose"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 dark:border-rose-500/40 dark:bg-rose-950/30 dark:text-rose-200">
            <p className="font-semibold">
              No tienes permisos para abrir{' '}
              <code className="rounded bg-rose-100 px-1.5 py-0.5 font-mono dark:bg-rose-950">
                /admin/finanzas
              </code>
            </p>
            <p className="mt-1.5 leading-relaxed text-slate-600 dark:text-zinc-300">
              Tu sesión actual es <strong>Colaborador Freelance (Camila Valdés)</strong>. Los
              presupuestos globales, márgenes de ganancia e impuestos F29 son exclusivos del{' '}
              <strong>Director</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setForbiddenErrorModalOpen(false);
                handleRoleChange('director');
              }}
              className="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
            >
              Cambiar a Director
            </button>
            <button
              type="button"
              onClick={() => setForbiddenErrorModalOpen(false)}
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
            >
              Entendido
            </button>
          </div>
        </div>
      </NativeModal>

      {/* Modal de Historial de Actividad */}
      <NativeModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title="Historial de Actividad"
        subtitle="Registro de cambios y accesos recientes"
        icon={ShieldCheck}
        accentColor="emerald"
        maxWidth="max-w-xl"
      >
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1 text-xs">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/90"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-slate-400 dark:text-zinc-500">
                    {log.timestamp}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">
                    {log.actor}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-zinc-300">{log.action}</p>
              </div>
              <span
                className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${
                  log.severity === 'danger'
                    ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300'
                    : log.severity === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300'
                    : 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300'
                }`}
              >
                {log.status}
              </span>
            </div>
          ))}
        </div>
      </NativeModal>
    </div>
  );
}

