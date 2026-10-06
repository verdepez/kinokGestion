# Kinok — Productora Audiovisual (Prototipo Ingeniería de Software)

Plataforma de gestión operativa, planificación temporal, control presupuestario y cálculo tributario para productora audiovisual (MVP Chile 2026).

---

## Cómo funciona la plataforma

### 1. Flujo de Cotización ("Cotizar Proyecto"), Estimador Dinámico y Generación de PDF
Desde el botón **`+ Cotizar Proyecto`**, se abre un asistente comercial y técnico en dos pasos:

- **Paso 1 — Rango de Fechas Dinámico y Estimador Gantt:**
  - Al seleccionar el **Tipo de Producción**, la **Fecha de Entrega / Lanzamiento** se recalcula automáticamente en base a la duración estándar del formato:
    | Tipo de Producción | Código | Duración Sugerida | Preproducción (`PRE_PRODUCTION`) | Producción / Rodaje (`PRODUCTION`) | Postproducción (`POST_PRODUCTION`) |
    | :--- | :--- | :--- | :---: | :---: | :---: |
    | **Comercial / Corporativo** | `video_corporativo` | 4 a 8 semanas (28–56 días) | **35%** | **10%** | **55%** |
    | **Cortometraje** | `cortometraje` | 2 a 4 meses (60–120 días) | **35%** | **15%** | **50%** |
    | **Largometraje** | `largometraje` | 1.5 a 2.5 años (540–900 días) | **25%** | **15%** | **60%** |
    | **Personalizado** | `personalizado` | Libre | **35%** | **15%** | **60%** |
  - Incluye **Calendario Interactivo de Rango de Fechas (`Date-Range Picker`)**, **Diagrama Gantt** con ajuste manual de hitos (`-1d` / `+1d`) y alertas de cuello de botella.

- **Paso 2 — Lanzamiento y Presupuesto + PDF de Cotización:**
  - Permite configurar las 4 partidas de costo directo (`Personal Técnico`, `Equipamiento`, `Logística/Viáticos`, `Imprevistos`), el **Margen Comercial (%)**, **Partner de Distribución**, contacto del cliente, validez de la oferta y condiciones comerciales.
  - Los botones **`Generar Cotización`** y **`Generar PDF Cotización`** guardan automáticamente los datos como proyecto en estado de cotización (`PENDING_APPROVAL`) y descargan un documento **PDF A4 profesional** listo para compartir por **WhatsApp** o **Correo Electrónico**.
  - Una vez que el cliente aprueba el presupuesto, el usuario presiona **`Confirmar Presupuesto`** en la plataforma y el proyecto se activa inmediatamente en los flujos de trabajo Kanban.

---

### 2. Ciclo de Vida Semántico y Acordeones Mobile por Fase
El ciclo de vida del proyecto se organiza en 4 fases estandarizadas:
1. **`PRE_PRODUCTION` (Preproducción)**
2. **`PRODUCTION` (Producción / Rodaje)**
3. **`POST_PRODUCTION` (Postproducción)**
4. **`DELIVERY_LAUNCH` (Entrega / Lanzamiento)**

- **Acordeón Desplegable en Mobile:** En pantallas móviles (`< lg`), cada grupo (`Preproducción`, `Producción / Rodaje`, `Postproducción` y `Entrega / Lanzamiento`) se agrupa en un acordeón desplegable con barra de acceso rápido. Al cambiar un proyecto de estado, pasa automáticamente al grupo destino, despliega su acordeón y muestra un aviso de confirmación.

---

### 3. Mosaico de Resumen (2x2), Formato `MM`/`K` y Apartado de Finanzas
- **Mosaico de 4 Tarjetas KPI:** Se visualiza en una cuadrícula `2x2` en mobile y `4` columnas en desktop, resumiendo las cifras en millones con **`MM`** (ej. `$30.4MM`) y miles con **`K`** (ej. `$218K`).
- **Interacción por Tap:**
  - **Tap en *"En Ejecución Activa"*:** Desplaza suavemente la pantalla hasta el apartado de los acordeones de fases.
  - **Tap en *"Flujo de Caja Neto"*, *"Provisión F29 (SII)"* o *"Presupuesto Ejecutado"*:** Despliega el **Apartado de Finanzas (Detalle Asociado)** con el desglose numérico completo y el detalle proyecto por proyecto.

---

### 4. Control de Acceso Basado en Roles (RBAC) y Finanzas SII (Chile 2026)
- **Director (`director`):** Acceso completo al tablero Kanban, finanzas, cotizaciones y control de alcance.
- **Colaborador Freelance (`freelance`):** Portal enfocado en sus tareas y carga de **Boletas de Honorarios Electrónicas (BHE)**; acceso bloqueado (`HTTP 403 Forbidden`) a `/admin/finanzas` con registro de auditoría.
- **Motor Tributario Chileno (SII 2026):** Cálculo en vivo de **IVA Débito (19%)** y **Retención BHE (15,25% — Ley 21.133)** con semáforo presupuestario (`En regla`, `Alerta`, `Sobrecosto`).

---

### 5. Persistencia con PostgreSQL y Despliegue en Railway
- El servidor Express (`server.js`) sirve el frontend compilado (`dist/`) y sincroniza con PostgreSQL mediante `DATABASE_URL` (incluyendo migraciones automáticas de columnas de cronograma y cotización: `quote_status`, `client_contact`, `quote_validity_days`, `quote_notes`, `quote_generated_at`).

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
