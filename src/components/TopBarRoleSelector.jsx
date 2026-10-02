import React from 'react';
import {
  ShieldCheck,
  Briefcase,
  Lock,
  Film,
  History,
  Sun,
  Moon,
} from 'lucide-react';
import { USERS } from '../data/mockData';

export default function TopBarRoleSelector({
  currentRole,
  onRoleChange,
  onTriggerForbiddenRoute,
  onOpenAuditModal,
  auditCount,
  theme,
  onToggleTheme,
}) {
  const activeUser = USERS[currentRole];
  const isDirector = currentRole === 'director';
  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md transition-colors dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Marca Kinok simplificada */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950">
            <Film className="h-4 w-4" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Kinok <span className="font-medium text-emerald-600 dark:text-emerald-400">Gestión</span>
            </span>
            <p className="hidden text-[11px] text-slate-500 dark:text-zinc-400 sm:block">
              Control de Proyectos y Presupuestos
            </p>
          </div>
        </div>

        {/* Controles: Selector de Rol + Usuario Activo + Tema Claro/Oscuro */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Selector de Rol Simplificado */}
          <div
            role="group"
            aria-label="Cambiar vista de usuario"
            className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <button
              type="button"
              onClick={() => onRoleChange('director')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isDirector
                  ? 'bg-white text-emerald-700 shadow-sm font-semibold dark:bg-emerald-500 dark:text-zinc-950'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span>Director</span>
            </button>

            <button
              type="button"
              onClick={() => onRoleChange('freelance')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                !isDirector
                  ? 'bg-white text-amber-700 shadow-sm font-semibold dark:bg-amber-400 dark:text-zinc-950'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5 shrink-0" />
              <span>Freelance</span>
            </button>
          </div>

          {/* Usuario Activo Compacto */}
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-800/60 md:flex">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                isDirector
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
              }`}
            >
              {activeUser.avatarInitials}
            </span>
            <span className="font-medium text-slate-700 dark:text-zinc-200">
              {activeUser.name}
            </span>
          </div>

          {/* Acción Rápida según Rol */}
          {!isDirector ? (
            <button
              type="button"
              onClick={onTriggerForbiddenRoute}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25"
              title="Simular intento de acceso a finanzas de administración"
            >
              <Lock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Probar bloqueo 403</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuditModal}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              title="Ver historial de actividad"
            >
              <History className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
              <span className="hidden sm:inline">Actividad</span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                {auditCount}
              </span>
            </button>
          )}

          {/* Botón de Cambio de Tema (Claro por defecto / Oscuro) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                <span>Claro</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-slate-600" />
                <span>Oscuro</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

