# Documentación Técnica de Arquitectura: DomoNow Visitor Parking Subsystem

Este documento define la arquitectura técnica formal de **DomoNow**, estructurada según el **Modelo C4** (Contexto, Contenedores y Componentes), delimitada **estrictamente a los requerimientos y reglas de negocio especificados en [openspec/specs/visitor-parking/spec.md](file:///Users/deals/Documents/GIT/DOMONOW-TEST/collection-domonow/openspec/specs/visitor-parking/spec.md)** y las implementaciones activas en las UIs y backend.

---

## 1. Trazabilidad de Requerimientos y Reglas de Negocio (`spec.md`)

Toda la arquitectura implementada y diagramada responde de forma unívoca a los 5 requerimientos normativos del subsistema:

| Identificador | Requerimiento Normativo | Endpoint / Caso de Uso | Reglas de Negocio / Invariantes Soportadas |
| :--- | :--- | :--- | :--- |
| **Req 1** | **Consulta y Filtrado de Cupos** | `GET /api/parking-spots?statusFilter=...` | • Retorna los 30 cupos configurados (`P-01` a `P-30`).<br>• Filtro opcional por estado (`Available`, `Occupied`, `OutOfService`).<br>• Si está ocupado, incluye detalle de la asignación activa. |
| **Req 2** | **Registro de Ingreso de Visitantes** | `POST /api/parking-assignments` | • Asigna cupo disponible, registra nombre de visitante y unidad de destino.<br>• Sanitiza y valida placa vehicular con formato estricto `^[A-Z0-9]{5,8}$` (HTTP 422 si es inválida).<br>• Registra fecha de ingreso en UTC y transiciona cupo a `Occupied` (HTTP 201).<br>• Si el cupo ya está ocupado, rechaza con **HTTP 409 Conflict**.<br>• Si el cupo está `OutOfService`, rechaza con **HTTP 422 Unprocessable Entity**. |
| **Req 3** | **Salida y Reversión de Cupo (Checkout)** | `POST /api/parking-assignments/{id}/checkout` | • Registra `exitTimeUtc` y marca asignación como `Completed`.<br>• **Regla de Invariante Temporal:** Verifica que `ExitTime >= EntryTime` (HTTP 400 Bad Request si la fecha de salida precede a la entrada).<br>• Retorna HTTP 200 OK con los minutos de estancia calculados.<br>• Restaura automáticamente el cupo asociado a estado `Available`.<br>• Si la asignación no existe, retorna **HTTP 404 Not Found**. |
| **Req 4** | **Resumen de Asignaciones Activas** | `GET /api/parking-assignments/active` | • Expone lista en tiempo real de vehículos actualmente estacionados.<br>• Retorna número de bahía, placa, visitante, unidad y tiempo transcurrido para el operador. |
| **Req 5** | **Control de Alta Concurrencia** | `ConcurrencyRaceControl` | • Garantía transaccional: Ante 10 solicitudes HTTP concurrentes sobre el cupo `P-15`, **exactamente 1 tiene éxito (HTTP 201 Created)** y **exactamente 9 son rechazadas con HTTP 409 Conflict**.<br>• La base de datos mantiene exactamente una sola fila activa gracias a la restricción física `uq_parking_active_assignment`. |

---

## 2. Justificación Arquitectónica en Lenguaje Natural

### 2.1 ¿Por qué Microfrontends en el Frontend? (Single-SPA, Angular 19 y Vue 3)

La solución de frontend no es un monolito acoplado, sino un ecosistema modular orquestado por **Single-SPA** que responde a las necesidades reales de los dos perfiles del sistema:

1. **Root Orchestrator (Vite + Single-SPA Core, Puerto 9000):**
   * **Propósito:** Actúa como contenedor institucional central.
   * **Funcionalidad Implementada:** Pantalla inicial de Login con credenciales estáticas (`guardia@domonow.io` / `DomoNow2026!`), botón de cierre de sesión (`#btn-logout`), persistencia de sesión en `localStorage ('domonow_auth_user')`, selector reactivo bilingüe `[ 🇪🇸 ESP | 🇺🇸 ENG ]` y carga del logo oficial `domonow-logo-320.webp`.
   * **Justificación:** Mantiene la autenticación y la navegación institucional desacoplada de los frameworks hijos, gestionando el ciclo de vida condicional (`activeWhen` solo si está autenticado).
2. **Microfrontend de Operaciones de Garita (Angular 19, Puerto 9001 - `/parking`):**
   * **Propósito:** Tablero de control operativo en tiempo real para el guardia.
   * **Funcionalidad Implementada:** Renderizado de la grilla de 30 cupos (`P-01` a `P-30`), filtros de estado (**Req 1**), modal de ingreso con máscara de placa y validaciones (**Req 2**), modal de checkout (**Req 3**) y simulador de ráfaga concurrente anti-carreras (**Req 5**).
   * **Justificación:** Angular 19 con **Angular Signals** garantiza un control de estados determinista, tipado estricto en formularios reactivos y prevención de fugas de memoria en la garita.
3. **Microfrontend de Analítica y Monitoreo (Vue 3, Puerto 9002 - `/analytics`):**
   * **Propósito:** Panel de supervisión analítica para el administrador de la copropiedad.
   * **Funcionalidad Implementada:** Monitoreo del resumen de asignaciones activas (**Req 4**), KPIs de visitas registradas hoy y tiempo promedio de estadía, matriz de calor semanal 24x7 (Heatmap), curva de demanda horaria y feed de actividad en vivo conectado al bus inter-MFE.
   * **Justificación:** Vue 3 y Pinia proporcionan un Virtual DOM altamente reactivo y liviano, ideal para matrices de datos densas sin penalizar la velocidad de la máquina de garita.
4. **Librería de Tokens Compartidos (`@domonow/ui-tokens`):**
   * Centraliza los tokens CSS (`#6C35DE`, tipografía *Plus Jakarta Sans*) y los diccionarios i18n para asegurar coherencia visual en todos los subproyectos.

---

### 2.2 ¿Por qué CQRS en el Backend?

El subsistema presenta una separación clara entre operaciones de escritura y de lectura:
* **Escrituras (Comandos - Req 2, Req 3 y Req 5):** Operaciones transaccionales que alteran el estado del estacionamiento. Exigen validación de invariantes, serialización y control de concurrencia optimista (`RowVersion` mapeado a `xmin` en PostgreSQL).
* **Lecturas (Consultas - Req 1 y Req 4):** Consultas de alta frecuencia para refrescar el estado de los cupos y alimentar el tablero del operador sin necesidad de tracking de entidades ni bloqueos de lectura.

**Beneficio:** Elimina la contención entre las consultas de los tableros y las transacciones de ingreso vehicular en la talanquera.

---

### 2.3 ¿Por qué Vertical Slice Architecture?

En lugar de capas horizontales tradicionales (*Controllers -> Services -> Repositories -> Entities*), el backend organiza el código por **casos de uso autónomos**:
* `GetParkingSpotsSlice` (Req 1)
* `RegisterParkingEntrySlice` (Req 2 y Req 5)
* `RegisterParkingCheckoutSlice` (Req 3)
* `GetActiveAssignmentsSlice` (Req 4)

**Beneficio:** Cada rebanada contiene su propio endpoint, comando/query, validador FluentValidation y handler. Si se modifica la regla temporal del checkout, el radio de impacto sobre el registro de ingreso es exactamente cero (*Blast Radius = 0*).

---

## 3. Diagramas de Arquitectura C4

Archivos Draw.io nativos disponibles en el repositorio:
* 📊 Archivo Maestro Multi-Pestaña: [c4-architecture.drawio](file:///Users/deals/Documents/GIT/DOMONOW-TEST/collection-domonow/docs/architecture/c4-architecture.drawio)
* 🌐 Diagrama de Contexto (Nivel 1): [c4-context.drawio](file:///Users/deals/Documents/GIT/DOMONOW-TEST/collection-domonow/docs/architecture/c4-context.drawio)
* 📦 Diagrama de Contenedores (Nivel 2): [c4-containers.drawio](file:///Users/deals/Documents/GIT/DOMONOW-TEST/collection-domonow/docs/architecture/c4-containers.drawio)
* 🧩 Diagrama de Componentes (Nivel 3): [c4-components.drawio](file:///Users/deals/Documents/GIT/DOMONOW-TEST/collection-domonow/docs/architecture/c4-components.drawio)

---

### 3.1 C4 - Nivel 1: Diagrama de Contexto del Sistema

Delimitado a los dos actores humanos soportados en la especificación y en las UIs:

```mermaid
C4Context
    title DomoNow Visitor Parking Subsystem - Diagrama de Contexto (C4 Nivel 1)

    Person(guard, "Guardia de Portería / Operador", "Opera garita en vivo: consulta cupos, registra entradas con placa normalizada, realiza checkout y resuelve carreras.")
    Person(admin, "Administrador / Supervisor", "Supervisa la copropiedad: consulta asignaciones activas, matriz de demanda 24x7 y rotación.")

    System(domonow, "DomoNow Visitor Parking Subsystem", "Subsistema de software que gestiona la asignación de 30 cupos (P-01 a P-30), control de ingresos/salidas, validaciones invariantes y prevención de carreras concurrentes.")

    Rel(guard, domonow, "1. Registra ingresos (HTTP 201)<br>2. Realiza checkout (HTTP 200)<br>3. Filtra cupos por estado<br>4. Resuelve carreras concurrentes (HTTP 409)", "HTTPS / UI Angular 19 :9001")
    Rel(admin, domonow, "1. Consulta asignaciones activas<br>2. Monitorea matriz de demanda 24x7<br>3. Audita eventos en vivo", "HTTPS / UI Vue 3 :9002")
```

---

### 3.2 C4 - Nivel 2: Diagrama de Contenedores

Representa los contenedores ejecutables que componen la solución implementada:

```mermaid
C4Container
    title DomoNow Visitor Parking Subsystem - Diagrama de Contenedores (C4 Nivel 2)

    Person(guard, "Guardia de Garita", "Opera terminal de portería")
    Person(admin, "Administrador", "Supervisa ocupación y analítica")

    System_Boundary(domonow_system, "DomoNow Visitor Parking Subsystem") {
        
        Container(root_mfe, "Root Orchestrator (Single-SPA)", "Vite, TypeScript, HTML5", "Puerto 9000. Login estático, sesión en localStorage, botón de logout, navbar institucional con logo oficial y selector bilingüe ESP/ENG.")
        
        Container(angular_mfe, "Microfrontend Operaciones (Angular 19)", "Angular 19, Signals, RxJS", "Puerto 9001 (/parking). Grilla de 30 cupos, filtros Available/Occupied/OutOfService, modales de entrada/salida y simulador concurrente P-15.")
        
        Container(vue_mfe, "Microfrontend Analítica (Vue 3)", "Vue 3, Vite, Pinia, ONNX", "Puerto 9002 (/analytics). Resumen de asignaciones activas, KPIs de visitas, matriz semanal 24x7, curva horaria y feed en tiempo real.")

        Container(tokens_pkg, "Design Tokens (@domonow/ui-tokens)", "CSS Variables, TS Interfaces", "Paleta institucional #6C35DE, tipografía Plus Jakarta Sans y diccionarios centralizados de i18n.")

        Container(backend_api, "DomoNow Parking API (.NET 10)", "ASP.NET Core, Minimal APIs, C# 14", "Vertical Slice Architecture + CQRS (MediatR). Ejecuta endpoints de consulta, registro, checkout y control de concurrencia.")

        ContainerDb(db_postgres, "Base de Datos Relacional", "PostgreSQL 17", "Tablas parking_spots (P-01 a P-30) y parking_assignments. Restricción física uq_parking_active_assignment y control xmin.")
    }

    Rel(guard, root_mfe, "Accede a login y operaciones", "HTTPS:9000")
    Rel(admin, root_mfe, "Accede a métricas y analítica", "HTTPS:9000")

    Rel(root_mfe, angular_mfe, "Monta bajo /parking si authenticated", "postMessage / Single-SPA")
    Rel(root_mfe, vue_mfe, "Monta bajo /analytics si authenticated", "postMessage / Single-SPA")
    Rel(tokens_pkg, angular_mfe, "Aplica tokens institucionales")
    Rel(tokens_pkg, vue_mfe, "Aplica tokens institucionales")

    Rel(angular_mfe, backend_api, "Ejecuta Comandos y Consultas (Req 1, 2, 3, 5)", "HTTP POST / GET - REST")
    Rel(vue_mfe, backend_api, "Consulta Resumen Activo y Demanda (Req 4)", "HTTP GET - REST")

    Rel(backend_api, db_postgres, "Persiste con EF Core 10 y Npgsql", "xmin / uq_parking_active_assignment")
```

---

### 3.3 C4 - Nivel 3: Diagrama de Componentes

Muestra el detalle interno de los componentes de Frontend y la correspondencia 1:1 de los Vertical Slices con la especificación `spec.md`:

```mermaid
C4Component
    title DomoNow Visitor Parking Subsystem - Diagrama de Componentes (C4 Nivel 3)

    Container_Boundary(fe_root, "Root Orchestrator (Single-SPA :9000)") {
        Component(c_auth, "AuthController", "TypeScript / HTML5", "Login estático (guardia@domonow.io / DomoNow2026!), píldora demo, sesión en localStorage y botón logout.")
        Component(c_spa, "SingleSpaRouter", "Single-SPA Core", "Verifica isAuthenticated() en activeWhen y monta dinámicamente Angular o Vue.")
        Component(c_i18n, "I18nCoordinator", "CustomEvent / postMessage", "Conmutador [ 🇪🇸 ESP | 🇺🇸 ENG ], actualiza navbar con logo oficial y sincroniza iframes.")
    }

    Container_Boundary(fe_ang, "Angular 19 Parking MFE (:9001)") {
        Component(c_grid, "ParkingGridComponent", "Req 1: Spot Retrieval & Filter", "Grilla de 30 cupos (P-01 a P-30) con filtrado por statusFilter (Available, Occupied, OutOfService).")
        Component(c_modals, "Entry / Checkout Modals", "Req 2 & 3: Entry & Checkout", "Máscara de placa regex ^[A-Z0-9]{5,8}$, registro de visitante/unidad y cálculo de estancia.")
        Component(c_sim, "ConcurrencySimulator", "Req 5: Concurrency Control", "Simula 10 peticiones concurrentes a P-15 (1 éxito HTTP 201 y 9 rechazos HTTP 409 Conflict).")
        Component(c_store, "ParkingService", "Angular Signals", "Estado reactivo de cupos, contadores y despacho de eventos.")
    }

    Container_Boundary(fe_vue, "Vue 3 Analytics MFE (:9002)") {
        Component(c_vstore, "AnalyticsStore", "Req 4: Active Assignments Query", "Almacena resumen de asignaciones activas (placa, unidad, tiempo transcurrido) y KPIs de visitas.")
        Component(c_heat, "DemandHeatmap", "Vue 3 SFC", "Matriz semanal 24x7 de saturación por días y franjas horarias.")
        Component(c_fcst, "PeakHourForecaster", "Vue 3 SFC", "Curva estimada de demanda horaria y tarjeta ONNX.")
        Component(c_feed, "ActivityFeed", "Vue 3 SFC", "Feed de eventos en tiempo real sincronizado por el bus inter-MFE.")
    }

    Container_Boundary(be_slices, "Backend Vertical Slices (.NET 10)") {
        Component(s_query_spots, "Slice: GetParkingSpotsQuery", "spec.md Req 1", "GET /api/parking-spots?statusFilter=... Retorna lista de 30 cupos con estado y asignación activa.")
        Component(s_entry, "Slice: RegisterParkingEntryCommand", "spec.md Req 2 & 5", "POST /api/parking-assignments. Valida placa ^[A-Z0-9]{5,8}$, asigna cupo, previene colisiones con uq_parking_active_assignment y xmin.")
        Component(s_chk, "Slice: RegisterParkingCheckoutCommand", "spec.md Req 3", "POST /api/parking-assignments/{id}/checkout. Valida ExitTime >= EntryTime (HTTP 400), restaura cupo a Available (HTTP 200).")
        Component(s_act, "Slice: GetActiveAssignmentsQuery", "spec.md Req 4", "GET /api/parking-assignments/active. Retorna lista de vehículos activos en parqueadero.")
        Component(s_pipeline, "Application Pipeline", "MediatR & Middleware", "FluentValidation, Logging y ExceptionHandlingMiddleware (mapea a 400, 404, 409 y 422 ProblemDetails).")
    }

    Rel(c_store, s_entry, "POST /api/parking-assignments", "JSON / HTTPS")
    Rel(c_store, s_chk, "POST /api/parking-assignments/{id}/checkout", "JSON / HTTPS")
    Rel(c_store, s_query_spots, "GET /api/parking-spots", "JSON / HTTPS")
    Rel(c_vstore, s_act, "GET /api/parking-assignments/active", "JSON / HTTPS")
```

---

## 4. Guía de Uso de los Archivos Draw.io

Los diagramas C4 están disponibles en formato XML nativo para **Draw.io (Diagrams.net)**:
1. **En la Web:** Puedes abrir [https://app.diagrams.net](https://app.diagrams.net) y seleccionar `Open Existing Diagram` -> [c4-architecture.drawio](file:///Users/deals/Documents/GIT/DOMONOW-TEST/collection-domonow/docs/architecture/c4-architecture.drawio).
2. **En VS Code:** Con la extensión `hediet.vscode-drawio`, haz clic sobre cualquiera de los archivos `.drawio` para editarlos interactivamente.
