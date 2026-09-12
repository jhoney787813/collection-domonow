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

A continuación se presentan las **capturas visuales oficiales exportadas desde Draw.io** junto con sus representaciones estructurales en **Mermaid**:

---

### 3.1 C4 - Nivel 1: Diagrama de Contexto del Sistema

Muestra el sistema en su entorno operativo delimitado exclusivamente a los dos actores humanos del dominio:

#### Vista Gráfica Oficial (Draw.io):
![C4 Nivel 1 - Diagrama de Contexto](img/c4-context.png)

#### Diagrama Estructural (Mermaid):
```mermaid
flowchart TB
    classDef person fill:#08427B,stroke:#052C52,color:#FFFFFF,stroke-width:2px;
    classDef system fill:#1168BD,stroke:#0B4884,color:#FFFFFF,stroke-width:2px;

    guard["<b>Guardia de Portería / Operador</b><br>[Persona]<br><br>Operador del puesto de control en garita.<br>Registra ingresos, procesa checkouts y consulta cupos."]::^person
    admin["<b>Administrador / Supervisor</b><br>[Persona]<br><br>Supervisor de la copropiedad.<br>Monitorea ocupación, rotación y matrices 24x7."]::^person

    domonow["<b>DomoNow Visitor Parking Subsystem</b><br>[Sistema de Software]<br><br>Gestiona 30 cupos comunales (P-01 a P-30), normalización regex de placas (^[A-Z0-9]{5,8}$),<br>invariante temporal en checkout y exclusión física de sobreasignación (uq_parking_active_assignment)."]::^system

    guard -->|"Registra ingresos, checkouts y consulta cupos<br><b>[HTTPS / Web Browser]</b>"| domonow
    admin -->|"Supervisa asignaciones activas, rotación y métricas<br><b>[HTTPS / Web Browser]</b>"| domonow
```

---

### 3.2 C4 - Nivel 2: Diagrama de Contenedores

Ilustra los contenedores ejecutables, tecnologías seleccionadas, protocolos y almacenamiento persistente:

#### Vista Gráfica Oficial (Draw.io):
![C4 Nivel 2 - Diagrama de Contenedores](img/c4-containers.png)

#### Diagrama Estructural (Mermaid):
```mermaid
flowchart TB
    classDef person fill:#08427B,stroke:#052C52,color:#FFFFFF,stroke-width:2px;
    classDef container fill:#438DD5,stroke:#2E6295,color:#FFFFFF,stroke-width:2px;
    classDef db fill:#2B78C5,stroke:#1C4E96,color:#FFFFFF,stroke-width:2px;
    classDef lib fill:#85BBF0,stroke:#5D82A8,color:#000000,stroke-width:2px;

    guard["<b>Guardia de Garita</b><br>[Persona]"]:::person
    admin["<b>Administrador</b><br>[Persona]"]:::person

    subgraph SystemBoundary ["DomoNow Visitor Parking Subsystem [Límite de Sistema]"]
        root["<b>Root Shell Orchestrator</b><br>[Contenedor: Single-SPA / TypeScript :9000]<br>Login institucional, sesión en localStorage, botón logout y selector [ 🇪🇸 ESP | 🇺🇸 ENG ]"]:::container
        angular["<b>Operaciones de Garita MFE</b><br>[Contenedor: Angular 19 Standalone Signals :9001 /parking]<br>Grilla de 30 cupos, filtros por estado, modales con regex y simulador concurrente P-15"]:::container
        vue["<b>Analítica y Monitoreo MFE</b><br>[Contenedor: Vue 3 Composition API & Pinia :9002 /analytics]<br>Resumen activo, KPIs de rotación, matriz semanal 24x7 y feed en tiempo real"]:::container
        tokens["<b>@domonow/ui-tokens</b><br>[Contenedor: Librería Compartida / NPM]<br>Tokens institucionales (#6C35DE, tipografía) y diccionarios centralizados de i18n"]:::lib
        api["<b>DomoNow Parking API</b><br>[Contenedor: .NET 10 LTS ASP.NET Core :5050]<br>Vertical Slice Architecture + CQRS con MediatR (endpoints consulta, ingreso, salida y resumen)"]:::container
        db[("<b>Base de Datos Relacional</b><br>[Contenedor: PostgreSQL 17 Alpine :5432]<br>Tablas parking_spots (P-01 a P-30) y parking_assignments. Índice uq_parking_active_assignment y xmin")]:::db
    end

    guard -->|"Accede a login y opera garita<br><b>[HTTPS :9000]</b>"| root
    admin -->|"Accede a login y analítica<br><b>[HTTPS :9000]</b>"| root
    root -->|"Carga y monta en runtime bajo /parking<br><b>[SystemJS / ES Modules]</b>"| angular
    root -->|"Carga y monta en runtime bajo /analytics<br><b>[SystemJS / ES Modules]</b>"| vue
    tokens -.->|"Aplica tokens de diseño y diccionarios i18n"| angular
    tokens -.->|"Aplica tokens de diseño y diccionarios i18n"| vue
    angular -->|"Envía comandos de registro, checkout y consulta cupos (Req 1, 2, 3, 5)<br><b>[HTTPS / REST JSON :5050]</b>"| api
    vue -->|"Consulta asignaciones activas y métricas de rotación (Req 4)<br><b>[HTTPS / REST JSON :5050]</b>"| api
    api -->|"Lee y escribe entidades con concurrencia optimista xmin<br><b>[TCP 5432 / Npgsql EF Core 10]</b>"| db
```

---

### 3.3 C4 - Nivel 3: Diagrama de Componentes

Detalla los componentes internos de Frontend, los Vertical Slices del Backend y la persistencia en base de datos:

#### Vista Gráfica Oficial (Draw.io):
![C4 Nivel 3 - Diagrama de Componentes](img/c4-components.png)

#### Diagrama Estructural (Mermaid):
```mermaid
flowchart TB
    classDef comp fill:#85BBF0,stroke:#5D82A8,color:#000000,stroke-width:1.5px;
    classDef dbTab fill:#E0F2FE,stroke:#0284C7,color:#0C4A6E,stroke-width:1.5px;

    subgraph MfeAngular ["Operaciones de Garita MFE [Límite de Contenedor: Angular 19 Signals :9001]"]
        grid["<b>ParkingGridComponent</b><br>[Angular Standalone - Req 1: Grilla y Filtros 30 Cupos]"]:::comp
        modals["<b>EntryCheckoutModalsComponent</b><br>[Angular Standalone - Req 2 & 3: Regex ^[A-Z0-9]{5,8}$ y Checkout]"]:::comp
        sim["<b>ConcurrencySimulatorComponent</b><br>[Angular Standalone - Req 5: Simulador 10 ráfagas a P-15]"]:::comp
        svc["<b>ParkingService</b><br>[Angular Signal Store & HTTP Client]"]:::comp
    end

    subgraph MfeVue ["Analítica y Monitoreo MFE [Límite de Contenedor: Vue 3 Pinia :9002]"]
        heat["<b>DemandHeatmapComponent</b><br>[Vue 3 SFC - Matriz semanal 24x7]"]:::comp
        fcst["<b>PeakHourForecasterComponent</b><br>[Vue 3 SFC / Chart - Curva horaria ONNX]"]:::comp
        feed["<b>ActivityFeedComponent</b><br>[Vue 3 SFC - Feed en tiempo real inter-MFE]"]:::comp
        store["<b>AnalyticsStore</b><br>[Pinia Store & HTTP Client - Req 4: Resumen Activo]"]:::comp
    end

    subgraph BackendApi ["DomoNow Parking API [Límite de Contenedor: .NET 10 LTS ASP.NET Core :5050]"]
        spotsCtrl["<b>ParkingSpotsController</b><br>[GET /api/parking-spots - Req 1]"]:::comp
        assignCtrl["<b>ParkingAssignmentsController</b><br>[POST entry, checkout, GET active - Req 2, 3, 4, 5]"]:::comp
        valBeh["<b>ValidationBehavior</b><br>[MediatR Behavior - FluentValidation regex]"]:::comp
        exMid["<b>ExceptionMiddleware</b><br>[ProblemDetails: 400, 404, 409, 422]"]:::comp
        hSpots["<b>GetParkingSpotsQueryHandler</b><br>[Req 1: Slice Consulta 30 Cupos]"]:::comp
        hEntry["<b>RegisterParkingEntryCommandHandler</b><br>[Req 2 & 5: Slice Ingreso y Concurrencia]"]:::comp
        hChk["<b>RegisterParkingCheckoutCommandHandler</b><br>[Req 3: Slice Salida y Reversión a Libre]"]:::comp
        hAct["<b>GetActiveAssignmentsQueryHandler</b><br>[Req 4: Slice Resumen Activo]"]:::comp
        domain["<b>Domain Model & Aggregates</b><br>[ParkingSpot, ParkingAssignment, LicensePlate VO]"]:::comp
        ef["<b>ParkingDbContext & Repositories</b><br>[EF Core 10 / Npgsql Provider & xmin]"]:::comp
    end

    subgraph DbPostgres ["Base de Datos Relacional [Límite de Contenedor: PostgreSQL 17 Alpine :5432]"]
        tSpots[("<b>parking_spots</b><br>[30 cupos P-01 a P-30, xmin Concurrency]")]:::dbTab
        tAssign[("<b>parking_assignments</b><br>[Asignaciones activas e historial]")]:::dbTab
        iActive{{"<b>uq_parking_active_assignment</b><br>[UNIQUE INDEX WHERE status = 1 - Req 5]"}}:::dbTab
    end

    svc -->|"GET /api/parking-spots?statusFilter=..."| spotsCtrl
    svc -->|"POST /api/parking-assignments & checkout"| assignCtrl
    store -->|"GET /api/parking-assignments/active"| assignCtrl
    assignCtrl -->|"ISender.Send"| hEntry
    assignCtrl -->|"ISender.Send"| hChk
    assignCtrl -->|"ISender.Send"| hAct
    spotsCtrl -->|"ISender.Send"| hSpots
    hEntry -->|"Aplica invariantes de negocio"| domain
    hChk -->|"Verifica ExitTime >= EntryTime"| domain
    hEntry -->|"Persiste asignación"| ef
    hChk -->|"Persiste checkout y restaura Disponible"| ef
    ef -->|"Sentencias SQL parametrizadas & xmin"| tAssign
    tAssign -.->|"Restricción de exclusión física"| iActive
```

---

## 4. Guía de Uso y Edición de los Archivos Draw.io

Los diagramas C4 están disponibles en formato XML estándar para **Draw.io (Diagrams.net)** con soporte para formas oficiales `mxgraph.c4`:
1. **En la Web:** Abre [https://app.diagrams.net](https://app.diagrams.net) y selecciona `Open Existing Diagram` -> [c4-architecture.drawio](file:///Users/deals/Documents/GIT/DOMONOW-TEST/collection-domonow/docs/architecture/c4-architecture.drawio).
2. **En VS Code / Antigravity:** Con la extensión `hediet.vscode-drawio`, puedes abrir directamente cualquiera de los archivos `.drawio` para visualizarlos o editarlos interactivamente con soporte para pestañas múltiples.
