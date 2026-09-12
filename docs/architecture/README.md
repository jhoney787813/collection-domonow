# Documentación Técnica de Arquitectura: DomoNow PropTech Platform

Este documento define la arquitectura técnica formal de **DomoNow**, estructurada según el **Modelo C4** (Contexto, Contenedores y Componentes), acompañada de la justificación técnica en lenguaje natural sobre las decisiones fundamentales de diseño de software: la adopción de **Microfrontends (Single-SPA)** en la capa de presentación y **CQRS con Vertical Slice Architecture** en el backend.

---

## 1. Justificación Arquitectónica en Lenguaje Natural

### 1.1 ¿Por qué Microfrontends en el Frontend? (Single-SPA, Angular 19 y Vue 3)

Tradicionalmente, las aplicaciones web se conciben como monolitos en el frontend. Si bien esto simplifica las etapas iniciales de desarrollo, genera graves problemas a medida que la plataforma escala: dependencias acopladas, despliegues "todo o nada", lentitud en la compilación y la imposibilidad de utilizar la herramienta óptima para cada caso de uso.

En **DomoNow**, la interfaz de usuario se dividió en microfrontends orquestados por **Single-SPA**:

```
                         [ Single-SPA Root Orchestrator ] (Puerto 9000)
                                        │
           ┌────────────────────────────┴────────────────────────────┐
           ▼                                                         ▼
[ Angular 19 Parking MFE ] (:9001)                         [ Vue 3 Analytics MFE ] (:9002)
  - Operaciones Críticas de Portería                         - Analítica Predictiva & Machine Learning
  - Formularios Reactivos & Tipado Estricto                  - Matriz de Calor 24x7 y Visualización Reactiva
  - Máquina de Estados & Prevención de Carreras              - Motor de Inferencia ONNX Runtime Web
```

#### Razones Clave de la Elección:
1. **Autonomía y Despliegue Desacoplado:**
   * El equipo encargado de la operativa en garita (asignación de cupos y cobro) puede actualizar, probar y desplegar el microfrontend de Angular sin reiniciar ni poner en riesgo la disponibilidad del módulo analítico o la pantalla de login institucional.
2. **Selección Tecnológica Adecuada al Problema (*Polyglot Frontend*):**
   * **Root Orchestrator (Vite + Single-SPA Core):** Un contenedor ultraligero y agnóstico que gestiona la autenticación inicial (Login estático RBAC), el navbar institucional superior, el estado de sesión y la coordinación bilingüe (ESP/ENG), sin la sobrecarga de un framework pesado en la raíz.
   * **Angular 19 (Operaciones de Garita):** Seleccionado para la operativa en vivo debido a su robustez empresarial, su sistema de tipos estricto y la nueva arquitectura reactiva de **Angular Signals**. Permite modelar la grilla de parqueaderos (P-01 a P-30), los estados transaccionales (Disponible, Ocupado, Fuera de Servicio) y la simulación de ráfagas concurrentes con predictibilidad matemática y cero fugas de memoria.
   * **Vue 3 (Analítica y Demanda Predictiva):** Seleccionado para la inteligencia de negocio por su reactividad fluida, ligereza y rendimiento superior al renderizar matrices densas (como el Heatmap semanal 24x7) y gráficos de tendencias horarias. Además, facilita la integración transparente de librerías de inferencia como ONNX Runtime Web sin penalizar la interfaz de garita.
3. **Resiliencia y Tolerancia a Fallos (*Fault Isolation*):**
   * Si un modelo analítico o un cálculo estadístico pesado en Vue consume memoria o experimenta una excepción, el microfrontend de Angular sigue operando sin interrupción, garantizando que los vehículos no queden atrapados en la talanquera.
4. **Coherencia Visual Mediante Tokens Compartidos (`@domonow/ui-tokens`):**
   * Todos los microfrontends consumen una única librería de tokens de diseño (colores HSL, `#6C35DE`, fuentes *Plus Jakarta Sans*, espaciados y diccionarios i18n), asegurando que el usuario final perciba una aplicación única, armónica y coherente.

---

### 1.2 ¿Por qué CQRS (Command Query Responsibility Segregation) en el Backend?

El negocio de gestión de parqueaderos en copropiedades presenta un comportamiento altamente asimétrico:
* **Escrituras (Comandos):** Representan una frecuencia moderada pero con **altísima contención de concurrencia**. Múltiples vehículos pueden solicitar el mismo cupo libre simultáneamente en horas pico, requiriendo validaciones estrictas de invariantes y control transaccional para evitar la sobreasignación (*double allocation race condition*).
* **Lecturas (Consultas):** Representan un volumen masivo y continuo (pantallas de garita refrescando el estado de 30 cupos, aplicaciones de residentes consultando disponibilidad, cámaras LPR verificando pre-autorizaciones).

#### Ventajas de Separar Comandos y Consultas:
1. **Optimización Diferenciada de Rendimiento:**
   * **Lado de Comandos (Write Side):** Implementado con **Entity Framework Core 10**, aplicando control de concurrencia optimista (`RowVersion` mapeado al campo de sistema `xmin` de PostgreSQL) e invariantes de dominio.
   * **Lado de Consultas (Read Side):** Implementado con consultas directas de baja latencia (Dapper o consultas de solo lectura) y caché distribuido en **Redis**, entregando respuestas en < 2 ms sin sobrecargar el motor relacional.
2. **Eliminación de Bloqueos (*Lock Contention*):**
   * Las consultas masivas de disponibilidad o auditoría nunca bloquean ni compiten por recursos con las transacciones críticas de apertura de barrera o registro de ingreso vehicular.
3. **Evolución Hacia Event-Driven Architecture:**
   * Cada comando ejecutado exitosamente emite un evento de dominio (`SpotAssignedDomainEvent`, `SpotReleasedDomainEvent`) que actualiza asíncronamente las proyecciones analíticas y las notificaciones a los residentes sin añadir latencia a la respuesta HTTP del guardia.

---

### 1.3 ¿Por qué Vertical Slice Architecture?

La arquitectura tradicional en "Capas Horizontales" (*Controllers -> Services -> Repositories -> Entities*) crea una separación artificial basada en conceptos técnicos y no en las capacidades del negocio.

```
Arquitectura en Capas Tradicional (Acoplamiento Horizontal):
[ Controllers ] ───▶ [ Services ] ───▶ [ Repositories ] ───▶ [ Database Entities ]
(Modificar una función requiere alterar 4 o 5 archivos en diferentes carpetas)

Vertical Slice Architecture (Alta Cohesión por Caso de Uso):
┌───────────────────────────────┐  ┌────────────────────────────────┐
│ Slice: RegisterParkingEntry   │  │ Slice: CompleteParkingCheckout │
│  - POST Endpoint              │  │  - POST Endpoint               │
│  - Command & FluentValidator  │  │  - Command & Validator         │
│  - MediatR Command Handler    │  │  - MediatR Command Handler     │
│  - Reglas de Concurrencia     │  │  - Liquidación de Fracción     │
└───────────────────────────────┘  └────────────────────────────────┘
```

#### Ventajas en el Proyecto DomoNow:
1. **Alta Cohesión y Bajo Acoplamiento:** Cada caso de uso (`RegisterParkingEntry`, `CompleteParkingCheckout`, `GetParkingSpotsQuery`, `GetDemandForecastQuery`) reside en su propio archivo/directorio autocontenido.
2. **Reducción del Radio de Afectación (*Blast Radius = Zero*):** Modificar la lógica de cobro al checkout no tiene ningún riesgo de romper la lógica de asignación inicial ni los modelos de consulta.
3. **Facilidad de Pruebas Unitarias y de Concurrencia:** Permite escribir pruebas de integración concurrentes dirigidas exactamente a la rebanada que maneja la carrera (ej. lanzar 10 solicitudes HTTP simultáneas sobre el cupo `P-15` y verificar que solo 1 resulte en HTTP 201 y 9 en HTTP 409 Conflict).

---

## 2. Diagramas de Arquitectura C4

Los diagramas están disponibles tanto en formato **Draw.io (`.drawio`)** para edición visual en Diagrams.net/VS Code, como en **Mermaid** para visualización directa en Markdown.

Archivos Draw.io incluidos en el repositorio:
* Archivo Maestro Multi-Pestaña: [c4-architecture.drawio](file:///Users/deals/Documents/GIT/DOMONOW-TEST/collection-domonow/docs/architecture/c4-architecture.drawio)
* Diagrama de Contexto (Nivel 1): [c4-context.drawio](file:///Users/deals/Documents/GIT/DOMONOW-TEST/collection-domonow/docs/architecture/c4-context.drawio)
* Diagrama de Contenedores (Nivel 2): [c4-containers.drawio](file:///Users/deals/Documents/GIT/DOMONOW-TEST/collection-domonow/docs/architecture/c4-containers.drawio)
* Diagrama de Componentes (Nivel 3): [c4-components.drawio](file:///Users/deals/Documents/GIT/DOMONOW-TEST/collection-domonow/docs/architecture/c4-components.drawio)

---

### 2.1 C4 - Nivel 1: Diagrama de Contexto del Sistema

Describe los límites de DomoNow frente a los usuarios humanos y los sistemas externos que componen la infraestructura física y digital de la copropiedad.

```mermaid
C4Context
    title DomoNow PropTech Platform - Diagrama de Contexto (C4 Nivel 1)

    Person(guard, "Guardia de Portería", "Personal de seguridad en garita. Opera ingresos, salidas y resolución de eventos.")
    Person(resident, "Residente / Propietario", "Habitante de la copropiedad. Pre-autoriza visitantes y consulta disponibilidad.")
    Person(admin, "Administrador de Copropiedad", "Audita ocupación, configura tarifas y visualiza analítica predictiva.")
    Person(visitor, "Visitante Vehicular", "Conductor que ingresa temporalmente a una unidad residencial.")

    System(domonow, "DomoNow PropTech Platform", "Plataforma integral de control de acceso vehicular, asignación concurrente de cupos, analítica predictiva y liquidación tarifaria.")

    System_Ext(lpr, "Cámaras LPR & Sensores IoT", "Reconocimiento automático de placas vehiculares en carril de acceso.")
    System_Ext(gates, "Barreras Vehiculares IoT", "Accionamiento electromecánico de apertura/cierre de talanqueras.")
    System_Ext(notif, "Pasarela de Notificaciones", "Envío de alertas vía WhatsApp Cloud API y Push Notifications.")
    System_Ext(payments, "Pasarela de Pagos (Wompi / PSE)", "Recaudo electrónico por fracciones de tiempo de estacionamiento.")

    Rel(guard, domonow, "Opera asignación de cupos y checkouts", "HTTPS / WebSockets")
    Rel(resident, domonow, "Pre-autoriza visitas y consulta cupos", "HTTPS / Mobile")
    Rel(admin, domonow, "Consulta analítica y reportes de ocupación", "HTTPS / Web")
    Rel(visitor, domonow, "Paga fracción mediante código QR", "Web Responsive")

    Rel(domonow, lpr, "Recibe lectura de placa vehicular", "MQTT / Webhook")
    Rel(domonow, gates, "Ordena apertura al confirmar asignación", "MQTT / Relay Protocol")
    Rel(domonow, notif, "Notifica al residente sobre llegada de visita", "HTTPS / REST")
    Rel(domonow, payments, "Liquida cobro de fracción", "REST / Webhooks")
```

---

### 2.2 C4 - Nivel 2: Diagrama de Contenedores

Muestra las aplicaciones ejecutables y almacenes de datos que conforman la solución, resaltando la separación de los microfrontends y los componentes del backend.

```mermaid
C4Container
    title DomoNow PropTech Platform - Diagrama de Contenedores (C4 Nivel 2)

    Person(guard, "Guardia de Garita", "Usuario operativo en portería")
    Person(admin, "Administrador", "Usuario supervisor")

    System_Boundary(domonow_system, "DomoNow Platform") {
        
        Container(root_mfe, "Root Orchestrator (Single-SPA)", "Vite, TypeScript, HTML5", "Puerto 9000. Pantalla de Login, sesión en localStorage, navbar institucional y conmutación bilingüe ESP/ENG.")
        
        Container(angular_mfe, "Microfrontend Operaciones", "Angular 19, Signals, RxJS", "Puerto 9001 (/parking). Grilla en vivo de 30 cupos, modales de registro/salida y simulación anti-carreras.")
        
        Container(vue_mfe, "Microfrontend Analítica", "Vue 3, Vite, Pinia, ONNX", "Puerto 9002 (/analytics). Matriz de calor 24x7, curva de demanda horaria y pronóstico ML de saturación.")

        Container(tokens_pkg, "Design Tokens (@domonow/ui-tokens)", "CSS Variables, TS Interfaces", "Paleta oficial #6C35DE, Plus Jakarta Sans y diccionarios centralizados de i18n.")

        Container(backend_api, "Parking Web API", "ASP.NET Core (.NET 10), C# 14", "Arquitectura Vertical Slice con CQRS y MediatR. Control optimista de concurrencia y validaciones de dominio.")

        ContainerDb(db_postgres, "Base de Datos Relacional", "PostgreSQL 16", "Almacena cupos (parking_spots), asignaciones e historial. Índice único uq_parking_active_assignment.")

        ContainerDb(cache_redis, "Caché en Memoria", "Redis 7", "Almacena en memoria el snapshot de disponibilidad de cupos para consultas inmediatas (< 2ms).")

        Container(bus_events, "Bus de Eventos de Dominio", "RabbitMQ / Internal MediatR", "Propaga SpotAssignedEvent y SpotReleasedEvent hacia analítica y auditoría.")
    }

    Rel(guard, root_mfe, "Accede a login y navegación", "HTTPS:9000")
    Rel(admin, root_mfe, "Accede a tableros de gestión", "HTTPS:9000")

    Rel(root_mfe, angular_mfe, "Orquesta montaje bajo /parking", "postMessage / Single-SPA")
    Rel(root_mfe, vue_mfe, "Orquesta montaje bajo /analytics", "postMessage / Single-SPA")
    Rel(tokens_pkg, angular_mfe, "Provee tokens y estilos institucionales")
    Rel(tokens_pkg, vue_mfe, "Provee tokens y estilos institucionales")

    Rel(angular_mfe, backend_api, "Envía Comandos de Asignación / Salida", "HTTP POST / REST")
    Rel(vue_mfe, backend_api, "Consulta Proyecciones y Métricas", "HTTP GET / REST")

    Rel(backend_api, db_postgres, "Persiste transacciones con bloqueo optimista", "EF Core 10 / Npgsql")
    Rel(backend_api, cache_redis, "Lee disponibilidad e invalida en escritura", "StackExchange.Redis")
    Rel(backend_api, bus_events, "Publica eventos de dominio asíncronos", "AMQP / Event Dispatch")
```

---

### 2.3 C4 - Nivel 3: Diagrama de Componentes

Detalla la estructura interna de los Microfrontends y la organización de los **Vertical Slices** en el Backend .NET 10.

```mermaid
C4Component
    title DomoNow Platform - Diagrama de Componentes (C4 Nivel 3)

    Container_Boundary(fe_root, "Root Orchestrator (Single-SPA :9000)") {
        Component(c_auth, "AuthController", "TypeScript", "Gestiona login estático, persistencia de sesión en localStorage y logout.")
        Component(c_spa, "SingleSpaRouter", "Single-SPA Core", "Verifica isAuthenticated() en activeWhen y monta/desmonta microfrontends.")
        Component(c_i18n, "I18nCoordinator", "CustomEvent / postMessage", "Coordina cambio reactivo ESP/ENG entre el shell y los iframes.")
    }

    Container_Boundary(fe_ang, "Angular 19 Parking MFE (:9001)") {
        Component(c_grid, "ParkingGridComponent", "Angular Component", "Renderiza grilla interactiva de cupos P-01 a P-30 y filtros de estado.")
        Component(c_modals, "Entry / Checkout Modals", "Reactive Forms", "Validación y máscara de placa vehicular ABC123 y cálculo de estadía.")
        Component(c_store, "ParkingService (Signals)", "Angular Signal Store", "Estado reactivo de cupos, contadores KPI y simulación de ráfagas.")
    }

    Container_Boundary(fe_vue, "Vue 3 Analytics MFE (:9002)") {
        Component(c_heat, "DemandHeatmap", "Vue 3 SFC", "Matriz 24x7 de saturación por días y franjas horarias.")
        Component(c_fcst, "PeakHourForecaster", "Vue 3 + ONNX Web", "Curva de demanda y motor de inferencia de saturación inminente.")
        Component(c_vstore, "AnalyticsStore (Pinia)", "Pinia Store", "KPIs de visitas, turnaround promedio y escucha de eventos cross-MFE.")
    }

    Container_Boundary(be_slices, "Backend Vertical Slices (.NET 10)") {
        
        Component(c_pipeline, "MediatR Pipeline", "Behaviors", "FluentValidation, Logging, ExceptionHandlingMiddleware (Mapeo a 409 Conflict).")

        Component(s_entry, "Slice: RegisterParkingEntry", "Command Handler", "Recibe comando, valida placa, carga agregado ParkingSpot, verifica invariante y persiste con xmin.")

        Component(s_chk, "Slice: CompleteCheckout", "Command Handler", "Recibe AssignmentId, valida fecha de salida >= entrada, libera cupo y genera cobro.")

        Component(s_query_spots, "Slice: GetParkingSpots", "Query Handler", "Lectura optimizada sin tracking (Dapper) consultando caché Redis (< 2ms).")

        Component(s_query_ml, "Slice: GetDemandForecast", "Query / Inference", "Genera matriz semanal de saturación y proyección de picos.")
        
        Component(s_events, "Domain Event Handlers", "Event Handlers", "Invalida caché en Redis y actualiza proyecciones de lectura al confirmar transacciones.")
    }

    Rel(c_store, s_entry, "POST /api/parking-assignments", "JSON / HTTPS")
    Rel(c_store, s_chk, "POST /api/parking-assignments/{id}/checkout", "JSON / HTTPS")
    Rel(c_store, s_query_spots, "GET /api/parking-spots", "JSON / HTTPS")
    Rel(c_vstore, s_query_ml, "GET /api/analytics/demand-forecast", "JSON / HTTPS")

    Rel(s_entry, s_events, "Emite SpotAssignedDomainEvent")
    Rel(s_chk, s_events, "Emite SpotReleasedDomainEvent")
```

---

## 3. Matriz de Decisiones Arquitectónicas (ADR)

| Identificador | Título de la Decisión | Estado | Contexto y Decisión | Consecuencia y Beneficio |
| :--- | :--- | :--- | :--- | :--- |
| **ADR-001** | **Microfrontends con Single-SPA** | Aceptado | Necesidad de desacoplar módulos de garita y analítica con ciclos de vida independientes. | Autonomía de despliegue, resiliencia ante fallos locales y carga modular. |
| **ADR-002** | **Poliglotismo en Frontend (Angular + Vue)** | Aceptado | Operaciones requiere control estricto de estados transaccionales; Analítica requiere renderizado fluido de matrices y modelos ML. | Angular 19 Signals para garita; Vue 3 y Pinia para tableros reactivos de demanda. |
| **ADR-003** | **CQRS en Backend (.NET 10)** | Aceptado | Asimetría crítica entre escrituras concurrentes (asignación de cupos) y lecturas masivas. | Eliminación de contención de bloqueos; escalabilidad independiente de consultas y comandos. |
| **ADR-004** | **Vertical Slice Architecture** | Aceptado | La arquitectura en capas tradicional provocaba dispersión de código y alto riesgo de regresiones. | Cada caso de uso es autónomo, facilitando pruebas unitarias, de integración y mantenimiento. |
| **ADR-005** | **Prevención Concurrente Anti-Carreras** | Aceptado | Riesgo de que dos vehículos reciban el mismo cupo comunal simultáneamente. | Doble defensa: Bloqueo optimista en aplicación (`RowVersion`) + Índice único parcial en PostgreSQL (`uq_parking_active_assignment`). |

---

## 4. Guía de Uso de los Archivos Draw.io

Los diagramas C4 fueron diagramados en formato nativo XML compatible con **Draw.io (Diagrams.net)**.

### ¿Cómo abrirlos y editarlos?
1. **En el Navegador:**
   * Abre [https://app.diagrams.net](https://app.diagrams.net).
   * Selecciona `Open Existing Diagram` y elige [docs/architecture/c4-architecture.drawio](file:///Users/deals/Documents/GIT/DOMONOW-TEST/collection-domonow/docs/architecture/c4-architecture.drawio) (o los archivos individuales de contexto, contenedores o componentes).
2. **En VS Code / Antigravity IDE:**
   * Si tienes instalada la extensión `Draw.io Integration` (`hediet.vscode-drawio`), simplemente haz clic sobre cualquier archivo `.drawio` en el explorador de archivos para editarlo interactivamente con paleta gráfica completa.
3. **Exportación:**
   * Puedes exportar los diagramas a formatos PNG de alta resolución, SVG vectorial o PDF para presentaciones ejecutivas o documentación institucional.
