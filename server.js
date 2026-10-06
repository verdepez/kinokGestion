import express from 'express';
import pg from 'pg';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { INITIAL_PROJECTS, INITIAL_AUDIT_LOGS } from './src/data/mockData.js';
import {
  normalizeProjectPhase,
  calculatePhaseSchedule,
} from './src/utils/scheduleEstimator.js';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));

// Configuración de conexión a PostgreSQL (compatible con red interna y pública de Railway)
const databaseUrl = process.env.DATABASE_URL;
const isInternalOrLocal =
  databaseUrl &&
  (databaseUrl.includes('.railway.internal') ||
    databaseUrl.includes('localhost') ||
    databaseUrl.includes('127.0.0.1'));

const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: isInternalOrLocal ? false : { rejectUnauthorized: false },
    })
  : null;

let dbReady = false;

// Estado en memoria de respaldo si no se ha definido DATABASE_URL en entorno local
let memoryProjects = structuredClone(INITIAL_PROJECTS);
let memoryAuditLogs = structuredClone(INITIAL_AUDIT_LOGS);

function rowToProject(row) {
  const projectType = row.project_type || 'video_corporativo';
  const startDate = row.start_date || '2026-09-15';
  const endDate = row.end_date || '2026-10-25';
  const phaseSchedule =
    row.phase_schedule && row.phase_schedule.phases
      ? row.phase_schedule
      : calculatePhaseSchedule({ startDate, endDate, projectType });

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    client: row.client,
    projectType,
    startDate,
    endDate,
    phase: normalizeProjectPhase(row.phase),
    daysRemaining: row.days_remaining,
    shootLocation: row.shoot_location,
    shootDates: row.shoot_dates || phaseSchedule.shootDatesLabel,
    distributionPartner: row.distribution_partner || '',
    phaseSchedule,
    desiredMarginPct: Number(row.desired_margin_pct),
    extraHourRateCLP: Number(row.extra_hour_rate_clp),
    assignedFreelancers: row.assigned_freelancers || ['usr-camila'],
    budgetCategories: row.budget_categories || {},
    expenses: row.expenses || [],
    revisions: row.revisions || [],
    freelanceTasks: row.freelance_tasks || [],
  };
}

async function upsertProject(client, p, sortOrder = 0) {
  const normalizedPhase = normalizeProjectPhase(p.phase);
  await client.query(
    `INSERT INTO projects (
      id, code, name, client, project_type, start_date, end_date,
      phase, days_remaining, shoot_location, shoot_dates,
      distribution_partner, phase_schedule, desired_margin_pct, extra_hour_rate_clp,
      assigned_freelancers, budget_categories, expenses, revisions, freelance_tasks, sort_order
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
    ON CONFLICT (id) DO UPDATE SET
      code = EXCLUDED.code,
      name = EXCLUDED.name,
      client = EXCLUDED.client,
      project_type = EXCLUDED.project_type,
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      phase = EXCLUDED.phase,
      days_remaining = EXCLUDED.days_remaining,
      shoot_location = EXCLUDED.shoot_location,
      shoot_dates = EXCLUDED.shoot_dates,
      distribution_partner = EXCLUDED.distribution_partner,
      phase_schedule = EXCLUDED.phase_schedule,
      desired_margin_pct = EXCLUDED.desired_margin_pct,
      extra_hour_rate_clp = EXCLUDED.extra_hour_rate_clp,
      assigned_freelancers = EXCLUDED.assigned_freelancers,
      budget_categories = EXCLUDED.budget_categories,
      expenses = EXCLUDED.expenses,
      revisions = EXCLUDED.revisions,
      freelance_tasks = EXCLUDED.freelance_tasks,
      sort_order = EXCLUDED.sort_order,
      updated_at = NOW()`,
    [
      p.id,
      p.code,
      p.name,
      p.client,
      p.projectType || 'video_corporativo',
      p.startDate || '2026-09-15',
      p.endDate || '2026-10-25',
      normalizedPhase,
      Number(p.daysRemaining) || 0,
      p.shootLocation || '',
      p.shootDates || '',
      p.distributionPartner || '',
      JSON.stringify(p.phaseSchedule || null),
      Number(p.desiredMarginPct) || 35,
      Number(p.extraHourRateCLP) || 55000,
      JSON.stringify(p.assignedFreelancers || ['usr-camila']),
      JSON.stringify(p.budgetCategories || {}),
      JSON.stringify(p.expenses || []),
      JSON.stringify(p.revisions || []),
      JSON.stringify(p.freelanceTasks || []),
      sortOrder,
    ]
  );
}

async function seedDatabase(client) {
  for (let i = 0; i < INITIAL_PROJECTS.length; i++) {
    await upsertProject(client, INITIAL_PROJECTS[i], i);
  }
  for (let i = 0; i < INITIAL_AUDIT_LOGS.length; i++) {
    const log = INITIAL_AUDIT_LOGS[i];
    await client.query(
      `INSERT INTO audit_logs (id, timestamp, actor, action, status, severity)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [log.id, log.timestamp, log.actor, log.action, log.status, log.severity]
    );
  }
}

async function initDatabase() {
  if (!pool) {
    console.log('DATABASE_URL no detectada: usando almacenamiento en memoria local.');
    return;
  }

  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          code TEXT NOT NULL,
          name TEXT NOT NULL,
          client TEXT NOT NULL,
          project_type TEXT DEFAULT 'video_corporativo',
          start_date TEXT DEFAULT '2026-09-15',
          end_date TEXT DEFAULT '2026-10-25',
          phase TEXT NOT NULL,
          days_remaining INT DEFAULT 15,
          shoot_location TEXT DEFAULT '',
          shoot_dates TEXT DEFAULT '',
          distribution_partner TEXT DEFAULT '',
          phase_schedule JSONB DEFAULT 'null'::jsonb,
          desired_margin_pct NUMERIC DEFAULT 35,
          extra_hour_rate_clp NUMERIC DEFAULT 55000,
          assigned_freelancers JSONB DEFAULT '[]'::jsonb,
          budget_categories JSONB DEFAULT '{}'::jsonb,
          expenses JSONB DEFAULT '[]'::jsonb,
          revisions JSONB DEFAULT '[]'::jsonb,
          freelance_tasks JSONB DEFAULT '[]'::jsonb,
          sort_order INT DEFAULT 0,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Migraciones no destructivas para bases PostgreSQL existentes en Railway
      await client.query(`
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'video_corporativo';
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date TEXT DEFAULT '2026-09-15';
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date TEXT DEFAULT '2026-10-25';
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS distribution_partner TEXT DEFAULT '';
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS phase_schedule JSONB DEFAULT 'null'::jsonb;
      `);

      // Normalizar estados semánticos antiguos en la base de datos ('Cerrado' -> 'DELIVERY_LAUNCH', etc.)
      await client.query(`
        UPDATE projects SET phase = 'PRE_PRODUCTION' WHERE phase = 'Preproducción';
        UPDATE projects SET phase = 'PRODUCTION' WHERE phase IN ('Producción', 'Producción / Rodaje');
        UPDATE projects SET phase = 'POST_PRODUCTION' WHERE phase = 'Postproducción';
        UPDATE projects SET phase = 'DELIVERY_LAUNCH', distribution_partner = COALESCE(NULLIF(distribution_partner, ''), 'McCann Worldgroup Chile · Distribución Multiplataforma') WHERE phase IN ('Cerrado', 'CLOSED');
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          timestamp TEXT NOT NULL,
          actor TEXT NOT NULL,
          action TEXT NOT NULL,
          status TEXT NOT NULL,
          severity TEXT DEFAULT 'info',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM projects');
      if (rows[0].count === 0) {
        console.log('Inicializando datos semilla en PostgreSQL...');
        await seedDatabase(client);
      }

      dbReady = true;
      console.log('Conectado exitosamente a PostgreSQL en Railway.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al inicializar PostgreSQL (usando respaldo en memoria):', err.message);
    dbReady = false;
  }
}

// Endpoints API
app.get('/api/health', async (_req, res) => {
  res.json({
    ok: true,
    database: dbReady ? 'postgresql' : 'memory',
  });
});

app.get('/api/state', async (_req, res) => {
  if (!dbReady || !pool) {
    return res.json({
      dbConnected: false,
      projects: memoryProjects,
      auditLogs: memoryAuditLogs,
    });
  }

  try {
    const projResult = await pool.query('SELECT * FROM projects ORDER BY sort_order ASC, id ASC');
    const auditResult = await pool.query(
      'SELECT id, timestamp, actor, action, status, severity FROM audit_logs ORDER BY created_at DESC LIMIT 50'
    );
    return res.json({
      dbConnected: true,
      projects: projResult.rows.map(rowToProject),
      auditLogs: auditResult.rows,
    });
  } catch (err) {
    console.error('Error en GET /api/state:', err.message);
    return res.json({
      dbConnected: false,
      projects: memoryProjects,
      auditLogs: memoryAuditLogs,
    });
  }
});

app.put('/api/projects', async (req, res) => {
  const { projects } = req.body;
  if (!Array.isArray(projects)) {
    return res.status(400).json({ error: 'Formato inválido de proyectos' });
  }

  memoryProjects = projects;

  if (!dbReady || !pool) {
    return res.json({ ok: true, dbConnected: false });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < projects.length; i++) {
      await upsertProject(client, projects[i], i);
    }
    await client.query('COMMIT');
    return res.json({ ok: true, dbConnected: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en PUT /api/projects:', err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.post('/api/audit', async (req, res) => {
  const { log } = req.body;
  if (!log || !log.id) {
    return res.status(400).json({ error: 'Log inválido' });
  }

  memoryAuditLogs = [log, ...memoryAuditLogs.slice(0, 49)];

  if (!dbReady || !pool) {
    return res.json({ ok: true, dbConnected: false });
  }

  try {
    await pool.query(
      `INSERT INTO audit_logs (id, timestamp, actor, action, status, severity)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [log.id, log.timestamp, log.actor, log.action, log.status, log.severity]
    );
    return res.json({ ok: true, dbConnected: true });
  } catch (err) {
    console.error('Error en POST /api/audit:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/reset', async (_req, res) => {
  memoryProjects = structuredClone(INITIAL_PROJECTS);
  memoryAuditLogs = structuredClone(INITIAL_AUDIT_LOGS);

  if (!dbReady || !pool) {
    return res.json({
      ok: true,
      dbConnected: false,
      projects: memoryProjects,
      auditLogs: memoryAuditLogs,
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM projects');
    await client.query('DELETE FROM audit_logs');
    await seedDatabase(client);
    await client.query('COMMIT');
    return res.json({
      ok: true,
      dbConnected: true,
      projects: INITIAL_PROJECTS,
      auditLogs: INITIAL_AUDIT_LOGS,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en POST /api/reset:', err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Servir frontend compilado (dist/) en producción (Railway)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Endpoint no encontrado' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Kinok Gestión activo en puerto ${PORT}`);
  });
});
