# Documentación Técnica de Arquitectura: DomoNow Visitor Parking Subsystem

Este documento formaliza la arquitectura técnica del subsistema **DomoNow**, modelada bajo el estándar internacional **Modelo C4 (Simon Brown)** en sus tres niveles representativos: **Contexto (Nivel 1)**, **Contenedores (Nivel 2)** y **Componentes (Nivel 3)**.

La arquitectura se encuentra delimitada **estrictamente a los requerimientos normativos y reglas de negocio especificados en [openspec/specs/visitor-parking/spec.md](file:///Users/deals/Documents/GIT/DOMONOW-TEST/collection-domonow/openspec/specs/visitor-parking/spec.md)** y las implementaciones activas en frontend y backend.

---

## 1. Trazabilidad de Requerimientos y Reglas de Negocio (`spec.md`)

Toda la arquitectura implementada y diagramada responde de forma unívoca a los 5 requerimientos normativos del subsistema:

| Identificador | Requerimiento Normativo | Endpoint / Caso de Uso | Reglas de Negocio / Invariantes Soportadas |
| :--- | :--- | :--- | :--- |
| **Req 1** | **Consulta y Filtrado de Cupos** | `GET /api/parking-spots?statusFilter=...` | • Retorna los 30 cupos configurados (`P-01` a `P-30`).<br>• Filtro opcional por estado (`Available`, `Occupied`, `OutOfService`).<br>• Si está ocupado, incluye detalle de la asignación activa (`ActiveAssignmentDto`). |
| **Req 2** | **Registro de Ingreso de Visitantes** | `POST /api/parking-assignments` | • Asigna cupo disponible, registra nombre de visitante y unidad de destino.<br>• Normaliza y valida placa con regex estricto `^[A-Z0-9]{5,8}$` (HTTP 422 si es inválida).<br>• Registra fecha de ingreso en UTC y transiciona cupo a `Occupied` (HTTP 201 Created).<br>• Si el cupo ya está ocupado, rechaza con **HTTP 409 Conflict**.<br>• Si el cupo está `OutOfService`, rechaza con **HTTP 422 Unprocessable Entity**. |
| **Req 3** | **Salida y Reversión de Cupo (Checkout)** | `POST /api/parking-assignments/{id}/checkout` | • Registra `exitTimeUtc` y marca asignación como `Completed`.<br>• **Invariante Temporal:** Verifica que `ExitTime >= EntryTime` (HTTP 400 Bad Request si la salida precede a la entrada).<br>• Retorna HTTP 200 OK con los minutos de estancia calculados.<br>• Restaura automáticamente el cupo asociado a estado `Available`.<br>• Si la asignación no existe, retorna **HTTP 404 Not Found**. |
| **Req 4** | **Resumen de Asignaciones Activas** | `GET /api/parking-assignments/active` | • Expone lista en tiempo real de vehículos actualmente estacionados.<br>• Retorna número de bahía, placa, visitante, unidad y tiempo transcurrido para el operador. |
| **Req 5** | **Control de Alta Concurrencia** | `ConcurrencyRaceControl` | • Garantía transaccional: Ante 10 solicitudes HTTP concurrentes sobre el cupo `P-15`, **exactamente 1 tiene éxito (HTTP 201 Created)** y **exactamente 9 son rechazadas con HTTP 409 Conflict**.<br>• La base de datos garantiza físicamente la unicidad mediante el índice parcial `uq_parking_active_assignment`. |

---

## 2. Justificación Arquitectónica en Lenguaje Natural

### 2.1 ¿Por qué Microfrontends en el Frontend? (Single-SPA, Angular 19 y Vue 3)

La interfaz de usuario no se diseñó como un monolito acoplado, sino como una federación orquestada mediante **Single-SPA**, respondiendo a perfiles y cargas operativas especializadas:

1. **Root Shell Orchestrator (Vite + TypeScript, Puerto 9000):**
   * **Propósito:** Núcleo institucional desacoplado del ciclo de vida de los frameworks hijos.
   * **Capacidades:** Control de acceso mediante pantalla estática de login (`guardia@domonow.io` / `DomoNow2026!`), persistencia de sesión en `localStorage ('domonow_auth_user')`, botón global de cierre de sesión (`#btn-logout`), barra de navegación con logo corporativo oficial (`domonow-logo-320.webp`), selector bilingüe reactivo `[ 🇪🇸 ESP | 🇺🇸 ENG ]` y orquestación dinámica de rutas (`activeWhen`).
   * **Justificación:** Centraliza la autenticación, identidad visual e internacionalización sin obligar a los microfrontends a compartir dependencias de ejecución ni recargar el navegador.

2. **Microfrontend de Operaciones de Garita (Angular 19, Puerto 9001 - `/parking`):**
   * **Propósito:** Consola operativa vehicular de alto tráfico para el guardia en portería.
   * **Capacidades:** Renderizado de la grilla de 30 cupos (`P-01` a `P-30`), filtros por estado (**Req 1**), modales reactivos con sanitización regex de placas (**Req 2**), proceso de checkout (**Req 3**) y simulador de ráfagas concurrentes anti-carreras (**Req 5**).
   * **Justificación:** Angular 19 con **Angular Signals** garantiza reactividad de grano fino, tipado estricto en formularios y minimización de consumo de memoria en hardware de portería.

3. **Microfrontend de Analítica y Monitoreo (Vue 3, Puerto 9002 - `/analytics`):**
   * **Propósito:** Panel analítico de supervisión para el administrador de la copropiedad.
   * **Capacidades:** Resumen de vehículos activos en garita (**Req 4**), matriz semanal de calor 24x7 (Heatmap) de ocupación, curva estimada de demanda horaria y feed en vivo de eventos conectado al bus inter-MFE.
   * **Justificación:** Vue 3 y Pinia proporcionan un Virtual DOM extremadamente ligero y eficiente para renderizar matrices densas de datos sin degradar el rendimiento del navegador.

4. **Librería de Componentes & Tokens (`@domonow/ui-tokens`):**
   * Centraliza la paleta institucional (`#6C35DE`, tipografía *Plus Jakarta Sans*) y los contratos TypeScript compartidos, garantizando coherencia visual inmediata.

---

### 2.2 ¿Por qué CQRS en el Backend?

La separación entre **Commands** (Escritura) y **Queries** (Lectura) resuelve la asimetría de carga del negocio:
* **Escrituras (Commands - Req 2, Req 3 y Req 5):** Operaciones transaccionales que modifican el estado de bahías y asignaciones. Exigen validación exhaustiva de invariantes, serialización y control de concurrencia optimista (`RowVersion` mapeado a `xmin` en PostgreSQL).
* **Lecturas (Queries - Req 1 y Req 4):** Consultas frecuentes de alto rendimiento para actualizar el tablero de garita y el monitor administrativo. Se ejecutan con `AsNoTracking()` sin sobrecarga de tracking de entidades ni bloqueos de escritura.

**Beneficio:** Máxima velocidad de lectura sin interferir con las transacciones críticas de ingreso en la talanquera.

---

### 2.3 ¿Por qué Vertical Slice Architecture?

En contraposición al enfoque de capas horizontales tradicionales (*Controllers -> Services -> Repositories -> Entities*), el backend organiza el código por **casos de uso autónomos**:
* `GetParkingSpotsSlice` (Req 1)
* `RegisterParkingEntrySlice` (Req 2 y Req 5)
* `RegisterParkingCheckoutSlice` (Req 3)
* `GetActiveAssignmentsSlice` (Req 4)

**Beneficio:** Cada rebanada vertical contiene su endpoint, comando o query, validador FluentValidation y handler. Una modificación a las reglas del checkout no afecta al registro de ingresos (*Blast Radius = 0*).

---

## 3. Diagramas Oficiales del Modelo C4

Los diagramas nativos en formato editable de Draw.io (Diagrams.net) están disponibles en el repositorio:
* 📊 **Archivo Maestro Multi-Pestaña:** [c4-architecture.drawio](file:///Users/deals/Documents/GIT/DOMONOW-TEST/collection-domonow/docs/architecture/c4-architecture.drawio)
* 🌐 **Diagrama de Contexto (Nivel 1):** [c4-context.drawio](file:///Users/deals/Documents/GIT/DOMONOW-TEST/collection-domonow/docs/architecture/c4-context.drawio)
* 📦 **Diagrama de Contenedores (Nivel 2):** [c4-containers.drawio](file:///Users/deals/Documents/GIT/DOMONOW-TEST/collection-domonow/docs/architecture/c4-containers.drawio)
* 🧩 **Diagrama de Componentes (Nivel 3):** [c4-components.drawio](file:///Users/deals/Documents/GIT/DOMONOW-TEST/collection-domonow/docs/architecture/c4-components.drawio)

---

### 3.1 C4 - Nivel 1: Diagrama de Contexto del Sistema

Muestra el sistema en su entorno operativo delimitado exclusivamente a los dos actores humanos del dominio:

```mermaid
C4Context
    title DomoNow Visitor Parking Subsystem - Diagrama de Contexto (C4 Nivel 1)

    Person(guard, "Guardia de Portería / Operador", "Opera garita en vivo: consulta cupos, registra entradas con placa normalizada, realiza checkout y resuelve carreras.")
    Person(admin, "Administrador / Supervisor", "Supervisa la copropiedad: consulta asignaciones activas, matriz de demanda 24x7 y rotación.")

    System(domonow, "DomoNow Visitor Parking Subsystem", "Subsistema de software que gestiona la asignación de 30 cupos (P-01 a P-30), control de ingresos/salidas, validaciones invariantes y prevención de carreras concurrentes.")

    Rel(guard, domonow, "Registra ingresos, realiza checkouts y consulta cupos", "HTTPS / Web Browser")
    Rel(admin, domonow, "Supervisa asignaciones activas y analítica de demanda", "HTTPS / Web Browser")
```

---

### 3.2 C4 - Nivel 2: Diagrama de Contenedores

Ilustra los contenedores ejecutables, tecnologías seleccionadas, protocolos y almacenamiento persistente:

```mermaid
C4Container
    title DomoNow Visitor Parking Subsystem - Diagrama de Contenedores (C4 Nivel 2)

    Person(guard, "Guardia de Garita", "Opera terminal de control en portería")
    Person(admin, "Administrador", "Supervisa ocupación y analítica")

    System_Boundary(domonow_system, "DomoNow Visitor Parking Subsystem") {
        Container(root_mfe, "Root Shell Orchestrator", "Single-SPA / TypeScript", "Puerto 9000. Login institucional, sesión en localStorage, botón logout, header con logo oficial y selector [ 🇪🇸 ESP | 🇺🇸 ENG ].")
        Container(angular_mfe, "Operaciones de Garita MFE", "Angular 19 Standalone Signals", "Puerto 9001 (/parking). Grilla de 30 cupos, filtros por estado, modales con validación regex de placa y simulador de ráfaga concurrente a P-15.")
        Container(vue_mfe, "Analítica y Monitoreo MFE", "Vue 3 Composition API & Pinia", "Puerto 9002 (/analytics). Resumen de asignaciones activas, KPIs de rotación, matriz semanal 24x7 y feed de eventos en vivo.")
        Container(tokens_pkg, "@domonow/ui-tokens", "Librería Compartida / NPM", "Tokens institucionales (#6C35DE, tipografía Plus Jakarta Sans) y diccionarios centralizados de internacionalización.")
        Container(backend_api, "DomoNow Parking API", ".NET 10 LTS ASP.NET Core", "Puerto 5050. Vertical Slice Architecture + CQRS con MediatR. Expone endpoints de consulta, registro, checkout y resumen activo.")
        ContainerDb(db_postgres, "Base de Datos Relacional", "PostgreSQL 17 Alpine", "Puerto 5432. Tablas parking_spots y parking_assignments. Índice único parcial uq_parking_active_assignment y control optimista xmin.")
    }

    Rel(guard, root_mfe, "Accede a login y opera garita", "HTTPS :9000")
    Rel(admin, root_mfe, "Accede a login y analítica", "HTTPS :9000")
    Rel(root_mfe, angular_mfe, "Carga y monta en runtime bajo /parking", "SystemJS / ES Modules")
    Rel(root_mfe, vue_mfe, "Carga y monta en runtime bajo /analytics", "SystemJS / ES Modules")
    Rel(tokens_pkg, vue_mfe, "Aplica tokens de diseño y diccionarios i18n", "NPM Link / ES Modules")
    Rel(angular_mfe, backend_api, "Envía comandos de registro, checkout y consulta cupos (Req 1, 2, 3, 5)", "HTTPS / REST JSON :5050")
    Rel(vue_mfe, backend_api, "Consulta asignaciones activas y métricas de rotación (Req 4)", "HTTPS / REST JSON :5050")
    Rel(backend_api, db_postgres, "Lee y escribe entidades con concurrencia optimista xmin", "TCP 5432 / Npgsql EF Core 10")
```

---

### 3.3 C4 - Nivel 3: Diagrama de Componentes

Detalla los componentes internos de Frontend, los Vertical Slices del Backend y la persistencia en base de datos:

```mermaid
C4Component
    title DomoNow Visitor Parking Subsystem - Diagrama de Componentes (C4 Nivel 3)

    Container_Boundary(ang_boundary, "Operaciones de Garita MFE (Angular 19 :9001)") {
        Component(c_grid, "ParkingGridComponent", "Angular Standalone", "Grilla reactiva de 30 cupos (P-01 a P-30) con filtrado por estado (Req 1).")
        Component(c_modals, "EntryCheckoutModalsComponent", "Angular Standalone", "Modales de registro con sanitización regex ^[A-Z0-9]{5,8}$ y checkout (Req 2 & 3).")
        Component(c_sim, "ConcurrencySimulatorComponent", "Angular Standalone", "Simula 10 peticiones concurrentes a P-15 (1 HTTP 201 y 9 HTTP 409) (Req 5).")
        Component(c_svc, "ParkingService", "Angular Signal Store", "Manejo reactivo de estado con Signals y despacho HTTP hacia la API.")
    }

    Container_Boundary(vue_boundary, "Analítica y Monitoreo MFE (Vue 3 :9002)") {
        Component(c_vstore, "AnalyticsStore", "Pinia Store", "Almacena resumen de asignaciones activas y KPIs de ocupación (Req 4).")
        Component(c_heat, "DemandHeatmapComponent", "Vue 3 SFC", "Matriz semanal 24x7 de demanda y saturación por franjas horarias.")
        Component(c_fcst, "PeakHourForecasterComponent", "Vue 3 SFC", "Curva estimada de demanda horaria y especificaciones ONNX.")
        Component(c_feed, "ActivityFeedComponent", "Vue 3 SFC", "Feed en tiempo real sincronizado mediante el bus inter-MFE.")
    }

    Container_Boundary(api_boundary, "DomoNow Parking API (.NET 10 LTS :5050)") {
        Component(c_spots_ctrl, "ParkingSpotsController", "ASP.NET Core Controller", "Expone GET /api/parking-spots (Req 1).")
        Component(c_assign_ctrl, "ParkingAssignmentsController", "ASP.NET Core Controller", "Expone POST registro, POST checkout y GET active (Req 2, 3, 4, 5).")
        Component(c_val_pipe, "ValidationBehavior", "MediatR IPipelineBehavior", "Ejecuta validaciones con FluentValidation antes del handler.")
        Component(c_ex_mid, "ExceptionMiddleware", "ASP.NET Core Middleware", "Mapea excepciones a ProblemDetails (400, 404, 409, 422).")
        Component(h_q_spots, "GetParkingSpotsQueryHandler", "MediatR Query Handler", "Consulta optimizada sin tracking de 30 cupos (Req 1).")
        Component(h_c_entry, "RegisterParkingEntryCommandHandler", "MediatR Command Handler", "Valida cupo, sanitiza placa y persiste en UTC (Req 2 & 5).")
        Component(h_c_chk, "RegisterParkingCheckoutCommandHandler", "MediatR Command Handler", "Verifica ExitTime >= EntryTime, calcula estadía y restaura cupo a Available (Req 3).")
        Component(h_q_act, "GetActiveAssignmentsQueryHandler", "MediatR Query Handler", "Consulta asignaciones activas con minutos de permanencia (Req 4).")
        Component(c_domain, "Domain Model & Aggregates", "Domain Layer", "Agregados ParkingSpot, ParkingAssignment y VO LicensePlate.")
        Component(c_ef, "ParkingDbContext & Repositories", "EF Core 10 / Npgsql", "Mapeo relacional, concurrencia xmin y persistencia transaccional.")
    }

    Container_Boundary(db_boundary, "Base de Datos Relacional (PostgreSQL 17 :5432)") {
        Component(t_spots, "parking_spots", "Tabla PostgreSQL", "Almacena 30 cupos (P-01 a P-30) con token xmin.")
        Component(t_assign, "parking_assignments", "Tabla PostgreSQL", "Historial y asignaciones activas.")
        Component(i_active, "uq_parking_active_assignment", "Índice Único Parcial", "Garantía física: WHERE status = 1 (Req 5).")
    }

    Rel(c_svc, c_spots_ctrl, "GET /api/parking-spots?statusFilter=...", "HTTPS / REST JSON")
    Rel(c_svc, c_assign_ctrl, "POST /api/parking-assignments & checkout", "HTTPS / REST JSON")
    Rel(c_vstore, c_assign_ctrl, "GET /api/parking-assignments/active", "HTTPS / REST JSON")
    Rel(c_assign_ctrl, h_c_entry, "Despacha comando con MediatR", "In-Process")
    Rel(h_c_entry, c_domain, "Aplica invariantes de agregado", "In-Process")
    Rel(h_c_entry, c_ef, "Persiste cambios transaccionales", "EF Core 10")
    Rel(c_ef, t_assign, "SQL parametrizado y verificación xmin", "TCP 5432 / Npgsql")
    Rel(t_assign, i_active, "Verifica exclusión de asignación única", "Database Engine")
```

---

## 4. Guía de Uso y Edición de los Archivos Draw.io

Los diagramas C4 están disponibles en formato XML estándar para **Draw.io (Diagrams.net)** con soporte para formas oficiales `mxgraph.c4`:
1. **En la Web:** Abre [https://app.diagrams.net](https://app.diagrams.net) y selecciona `Open Existing Diagram` -> [c4-architecture.drawio](file:///Users/deals/Documents/GIT/DOMONOW-TEST/collection-domonow/docs/architecture/c4-architecture.drawio).
2. **En VS Code / Antigravity:** Con la extensión `hediet.vscode-drawio`, puedes abrir directamente cualquiera de los archivos `.drawio` para visualizarlos o editarlos interactivamente con soporte para pestañas múltiples.
