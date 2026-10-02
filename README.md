# Kinok Gestión — Prototipo Ingeniería de Software

Plataforma de gestión operativa, presupuestaria y tributaria para productora audiovisual (MVP Chile 2026).

## Características principales

- **Tema Claro / Oscuro**: Interfaz limpia con tema claro por defecto y selector de tema oscuro persistente.
- **Control de Acceso Basado en Roles (RBAC)**:
  - **Director**: Panel de proyectos (Kanban), KPIs financieros, presupuestador por categorías, registro de gastos reales y control de revisiones de video.
  - **Colaborador Freelance**: Vista enfocada en sus tareas asignadas y carga de Boletas de Honorarios (con bloqueo HTTP 403 a rutas administrativas como `/admin/finanzas`).
- **Motor Tributario Chileno (SII 2026)**:
  - Cálculo automático de IVA Débito (19%) y Retención de Boletas de Honorarios Electrónicas (15,25%).
  - Semáforo de desviación presupuestaria en tiempo real (`< 90%` En regla, `≥ 90%` Alerta, `≥ 100%` Sobrecosto).

## Requisitos e Instalación

```bash
npm install
```

## Ejecución en Desarrollo

```bash
npm run dev
```

## Compilación para Producción

```bash
npm run build
```
