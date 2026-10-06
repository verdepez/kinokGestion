# Kinok — Productora Audiovisual (Prototipo Ingeniería de Software)

Plataforma de gestión operativa, planificación temporal, control presupuestario y cálculo tributario para productora audiovisual (MVP Chile 2026).

---

## Cómo funciona la plataforma

### 1. Estimador Automatizado de Cronograma y Gantt (`Schedule Estimator`)
Al crear un nuevo proyecto desde el botón **`+ Nuevo Proyecto (Estimador)`**, se abre un asistente interactivo en dos pasos que reemplaza la selección manual de fases por un motor proporcional basado en estándares de la industria audiovisual:

- **Selección de Tipo de Producción y Distribución Proporcional:**
  | Tipo de Producción | Código | Duración Sugerida | Preproducción (`PRE_PRODUCTION`) | Producción / Rodaje (`PRODUCTION`) | Postproducción (`POST_PRODUCTION`) |
  | :--- | :--- | :--- | :---: | :---: | :---: |
  | **Comercial / Corporativo** | `video_corporativo` | 4 a 8 semanas (28–56 días) | **35%** | **10%** | **55%** |
  | **Cortometraje** | `cortometraje` | 2 a 4 meses (60–120 días) | **35%** | **15%** | **50%** |
  | **Largometraje** | `largometraje` | 1.5 a 2.5 años (540–900 días) | **25%** | **15%** | **60%** |
  | **Personalizado** | `personalizado` | Libre | **35%** | **15%** | **50%** |

- **Calendario Interactivo de Rango de Fechas (`Date-Range Picker`):**
  - Permite seleccionar con clic la **Fecha de Inicio** y la **Fecha Estimada de Entrega/Lanzamiento** sobre el calendario mensual, coloreando cada día según la etapa correspondiente (`Preproducción`, `Rodaje`, `Postproducción` y `Lanzamiento`).
- **Previsualización en Diagrama Gantt y Ajuste de Hitos:**
  - Muestra en tiempo real una barra Gantt proporcional con la duración en días y porcentaje de cada etapa.
  - El usuario puede **ajustar las fechas límite de cada hito** (`Fin Preproducción` y `Fin Producción / Rodaje` mediante selector de fecha o botones `-1d` / `+1d`) antes de confirmar la creación.
- **Alertas de Estándar de Industria:**
  - Si el tiempo asignado a **Preproducción** o **Postproducción** es críticamente corto respecto al estándar del formato elegido, el estimador muestra alertas preventivas de cuello de botella.
- **Asignación Automática de Fase:**
  - La fase activa inicial del proyecto se infiere automáticamente comparando la fecha actual con los hitos del cronograma.

---

### 2. Ciclo de Vida Semántico de Estados y Fases
Se deprecó el estado genérico `Cerrado` (`CLOSED`) para reflejar el flujo real de una productora audiovisual a través de 4 fases estandarizadas:

1. **`PRE_PRODUCTION` (Preproducción):** Guion técnico, scouting, casting, diseño de producción y plan de rodaje.
2. **`PRODUCTION` (Producción / Rodaje):** Rodaje principal en locación o estudio, sonido directo y dailies.
3. **`POST_PRODUCTION` (Postproducción):** Montaje offline/online, VFX, mezcla de sonido, color grading y rondas de revisión.
4. **`DELIVERY_LAUNCH` (Entrega / Lanzamiento):** Masterización final, entrega a cliente y distribución. Incluye soporte para asociar un **Partner de Distribución / Agencia de Lanzamiento** tanto en la creación como en la vista de detalle del proyecto.

---

### 3. Control de Acceso Basado en Roles (RBAC) y Finanzas SII (Chile 2026)
- **Director (`director`):**
  - Acceso completo al tablero Kanban por fases, KPIs de flujo de caja neto, provisión F29, presupuestador por partidas (`Personal Técnico`, `Equipamiento`, `Logística/Viáticos`, `Imprevistos`), registro de gastos reales y control de alcance en revisiones de video.
- **Colaborador Freelance (`freelance`):**
  - Portal enfocado exclusivamente en sus tareas asignadas y carga de **Boletas de Honorarios Electrónicas (BHE)**.
  - Cualquier intento de acceder a rutas financieras administrativas (`/admin/finanzas`) es bloqueado con **HTTP 403 Forbidden** y registrado en el historial de auditoría.
- **Motor Tributario Chileno (SII 2026):**
  - Cálculo en vivo de **IVA Débito (19%)** sobre precio de venta neto y **Retención de Boletas de Honorarios (15,25% — Ley 21.133)**.
  - **Semáforo presupuestario:** Verde (`< 90%` En regla), Amarillo (`≥ 90%` Alerta preventiva) y Rojo (`≥ 100%` Sobrecosto).

---

### 4. Persistencia con PostgreSQL y Despliegue en Railway
- El servidor Express (`server.js`) sirve el frontend compilado (`dist/`) y se conecta automáticamente a PostgreSQL mediante la variable de entorno `DATABASE_URL`.
- Al iniciar, crea automáticamente las tablas `projects` y `audit_logs`, ejecuta migraciones no destructivas (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) para las columnas de cronograma (`project_type`, `start_date`, `end_date`, `phase_schedule`, `distribution_partner`) y normaliza cualquier estado antiguo (`Cerrado` → `DELIVERY_LAUNCH`).
- Si se ejecuta en local sin `DATABASE_URL`, opera de forma transparente con almacenamiento en memoria.

---

## Instalación y Comandos

```bash
# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo (Vite)
npm run dev

# Compilar bundle de producción en dist/
npm run build

# Iniciar servidor de producción (Express + PostgreSQL)
npm start
```
