# SPECIFICATION: DOMONOW VISITOR PARKING SYSTEM (OPEN SPEC v1.0)
<!--
  SPEC-METADATA:
  System: DomoNow PropTech Platform
  Subsystem: Visitor Parking Management (Control de Parqueaderos de Visitantes)
  Author: Jhon Edison Hincapié García (Solutions Architect & Senior Full Stack Engineer)
  Target Engine: Google Antigravity Agent / Spec-Driven Development (SDD) Engine
  Compliance: Open Spec 1.0, Clean Architecture, Single-SPA Microfrontends, .NET 10 LTS
  Host Environment: macOS 26.6.2 (Darwin Kernel 25G83, Apple Silicon ARM64)
  Container Runtime: Podman 5.x / Podman Compose
-->

---

## 1. PROJECT SPECIFICATION & RUNTIME CONTEXT

### 1.1 Development Platform & Toolchain Specifications
* **Host Operating System:** macOS 26.6.2 (Darwin 25G83), Apple Silicon (ARM64 architecture).
* **Container Virtualization Engine:** `podman` (v5.x+) with rootless podman machine, podman-compose, and native socket forwarding (`unix:///Users/$USER/.local/share/containers/podman/machine/podman.sock`).
* **Backend Runtime:** .NET 10 SDK (v10.0.x-arm64), C# 14, ASP.NET Core Web API, Entity Framework Core 10.
* **Database Engine:** PostgreSQL 17 Alpine via Podman Container, utilizing explicit isolation levels, advisory locks, and row-level concurrency tokens.
* **Frontend Microfrontends Architecture:**
  * **Root Orchestrator (Single-SPA Root Config):** Vanilla TypeScript / HTML5 shell loader (`@single-spa/layout`, `systemjs` / native import maps).
  * **MFE-1 (Parking Operations App):** Angular 19+ (Standalone Components, Signals, OnPush change detection, Zone-less or light Zone).
  * **MFE-2 (Analytics & Predictive Demand App):** Vue.js 3+ (Composition API, `<script setup>`, Pinia, Vite).
  * **MFE Shared Design System:** Tailwind CSS v4 & DomoNow Web Components / Shared CSS Design Tokens library.

### 1.2 Open Spec Project Structure
```text
domonow-parking/
├── .agent/                             # Antigravity agent instructions and validation rules
│   ├── rules.yaml
│   └── workflows.yaml
├── open-spec/                          # Open Spec formal specifications
│   ├── 00-system-overview.md
│   ├── 01-domain-model.md
│   ├── 02-contracts-api.yaml           # OpenAPI 3.1 contract
│   ├── 03-architecture-backend.md
│   ├── 04-microfrontends-spec.md
│   ├── 05-design-tokens.json           # DomoNow visual system tokens
│   ├── 06-database-ddl.sql
│   └── 07-ai-usage-template.md
├── podman/
│   ├── Containerfile.backend
│   ├── Containerfile.root-mfe
│   ├── Containerfile.angular-mfe
│   ├── Containerfile.vue-mfe
│   └── podman-compose.yaml
├── src/
│   ├── backend/                        # .NET 10 Clean Architecture
│   │   ├── DomoNow.Parking.Domain/
│   │   ├── DomoNow.Parking.Application/
│   │   ├── DomoNow.Parking.Infrastructure/
│   │   ├── DomoNow.Parking.Api/
│   │   └── DomoNow.Parking.UnitTests/
│   └── frontend/                       # Single-SPA Microfrontends Monorepo
│       ├── root-config/                # Shell Orchestrator & Import Maps
│       ├── domonow-angular-parking/    # Angular 19 Operations MFE
│       ├── domonow-vue-analytics/      # Vue 3 Analytics & Demand MFE
│       └── domonow-ui-tokens/          # Shared Design Tokens & Styles
├── AI-USAGE.md                         # Mandatory AI engineering decisions log
└── README.md                           # Master orchestration and execution guide
```

---

## 2. DOMONOW DESIGN SYSTEM & BRAND TOKEN SPECIFICATION

All user interfaces (Root Shell, Angular MFE, Vue MFE) must strictly adhere to DomoNow's design tokens and aesthetic guidelines.

### 2.1 Color Tokens (CSS Variables & Tailwind 4 Configuration)
```css
:root {
  /* Brand Core */
  --domo-primary: #6C35DE;
  --domo-primary-hover: #5825C6;
  --domo-primary-dark: #4A1E9E;
  --domo-primary-light: #F3E8FF;
  --domo-lavender-subtle: #EDE9FE;
  --domo-lavender-canvas: #FAF5FF;

  /* Neutrals & Surfaces */
  --domo-neutral-black: #111827;
  --domo-neutral-carbon: #0F172A;
  --domo-neutral-secondary: #4B5563;
  --domo-neutral-muted: #64748B;
  --domo-neutral-border: #E2E8F0;
  --domo-neutral-divider: #E5E7EB;
  --domo-surface-white: #FFFFFF;
  --domo-surface-canvas: #F8FAFC;
  --domo-surface-alt: #F9FAFB;

  /* Functional Feedback */
  --domo-status-success: #10B981;
  --domo-status-whatsapp: #25D366;
  --domo-status-warning: #F59E0B;
  --domo-status-danger: #EF4444;
  --domo-status-occupied: #6C35DE;
  --domo-status-available: #10B981;
  --domo-status-outofservice: #94A3B8;

  /* Elevations & Geometry */
  --domo-radius-sm: 8px;
  --domo-radius-md: 12px;
  --domo-radius-lg: 16px;
  --domo-radius-full: 9999px;
  --domo-shadow-card: 0 4px 20px -2px rgba(108, 53, 222, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04);
  --domo-shadow-hover: 0 10px 25px -3px rgba(108, 53, 222, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.05);

  /* Typography */
  --domo-font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### 2.2 Component Visual Contracts
* **Primary Buttons:** Background `var(--domo-primary)`, text white, `border-radius: 10px`, transition on hover to `var(--domo-primary-hover)`, shadow subtle.
* **Secondary / Outline Buttons:** Transparent background, 1.5px border `var(--domo-neutral-border)`, text `var(--domo-neutral-carbon)`, hover background `var(--domo-primary-light)`.
* **Parking Spot Status Badges:**
  * **Disponible:** Background `#ECFDF5`, text `#065F46`, border `1px solid #A7F3D0`. Dot indicator `#10B981`.
  * **Ocupado:** Background `var(--domo-primary-light)`, text `var(--domo-primary-dark)`, border `1px solid #DDD6FE`. Dot indicator `var(--domo-primary)`.
  * **Fuera de Servicio:** Background `#F1F5F9`, text `#475569`, border `1px solid #CBD5E1`. Dot indicator `#94A3B8`.
* **Elevation & Card Styling:** Background `#FFFFFF`, border `1px solid #E2E8F0`, `border-radius: 16px`, padding `20px`, box-shadow `var(--domo-shadow-card)`.

---

## 3. DOMAIN-DRIVEN DESIGN (DDD) SPECIFICATION

### 3.1 Ubiquitous Language & Core Entities
1. **ParkingSpot (Aggregate Root):** Represents an identified physical space within the residential property.
   * `Id`: UUID (Guid)
   * `SpotNumber`: String (e.g., "P-01", "P-15")
   * `Status`: Enum (`Available = 1`, `Occupied = 2`, `OutOfService = 3`)
   * `RowVersion`: `byte[]` / `uint` xmin for Optimistic Concurrency Control.
2. **ParkingAssignment (Aggregate Root / Entity):** Records the visitor's occupancy.
   * `Id`: UUID (Guid)
   * `ParkingSpotId`: UUID (Foreign Key to ParkingSpot)
   * `LicensePlate`: Value Object (String normalized: uppercase, alphanumeric only, e.g., `ABC123`).
   * `VisitorName`: Value Object (String, trimmed, 2-100 characters).
   * `DestinationUnit`: Value Object (String, apartment/house identifier, e.g., "Tower 2 - Apt 402").
   * `EntryTime`: DateTimeOffset (UTC)
   * `ExitTime`: DateTimeOffset? (UTC, nullable, must be >= EntryTime)
   * `Status`: Enum (`Active = 1`, `Completed = 2`, `Cancelled = 3`)
3. **Domain Events:**
   * `ParkingAssignedDomainEvent`: Dispatched when a spot is assigned.
   * `ParkingCheckoutDomainEvent`: Dispatched upon visitor departure.
   * `ParkingSpotStatusChangedDomainEvent`: Dispatched when a spot is decommissioned or reinstated.

### 3.2 Invariant Enforcement & Business Rules
* **Rule 1 (Single Active Assignment):** A `ParkingSpot` can never have more than one active assignment. Enforced at domain level AND backed by PostgreSQL partial unique index:
  ```sql
  CREATE UNIQUE INDEX uq_parking_active_assignment 
  ON parking_assignments (parking_spot_id) 
  WHERE status = 1; -- 1: Active
  ```
* **Rule 2 (Out of Service Prohibition):** An assignment creation must fail immediately with domain exception `DomainValidationException("ParkingSpotOutOfService")` if status is `OutOfService`.
* **Rule 3 (Checkout Reversion):** Completing an assignment (`ExitTime = UtcNow`, `Status = Completed`) automatically sets `ParkingSpot.Status = Available`.
* **Rule 4 (License Plate Sanitization Value Object):** Input string `abc-123` or ` abc 123 ` regex-transformed to `^[A-Z0-9]{5,8}$` -> `ABC123`.
* **Rule 5 (Temporal Validation):** Invariant `ExitTime >= EntryTime` enforced inside the entity method `CompleteCheckout(DateTimeOffset exitTimeUtc)`.
* **Rule 6 (Concurrency Control):** Handled through two layers:
  * Optimistic Concurrency via EF Core `IsRowVersion()` / PostgreSQL `xmin`.
  * Database Level: Pessimistic Row Lock (`SELECT FOR UPDATE`) or the partial unique constraint when acquiring the active assignment.

---

## 4. BACKEND ARCHITECTURE SPECIFICATION (.NET 10 LTS)

### 4.1 Clean Architecture Solution Layers
```text
src/backend/
├── DomoNow.Parking.Domain/              # Pure C# 14. Entities, ValueObjects, Exceptions, Events
├── DomoNow.Parking.Application/         # CQRS Handlers, Behaviors, DTOs, FluentValidation, Interfaces
├── DomoNow.Parking.Infrastructure/      # EF Core DbContext, Migrations, Repositories, Caching
└── DomoNow.Parking.Api/                 # Minimal APIs / Controllers, Middlewares, OpenAPI Specs
```

### 4.2 Application CQRS Endpoints & Contracts
1. `GET /api/parking-spots`
   * **Query:** `GetParkingSpotsQuery(ParkingSpotStatus? statusFilter)`
   * **Response:** `200 OK` -> `List<ParkingSpotDto>` with `id`, `spotNumber`, `status`, `currentAssignment` (if occupied).
2. `POST /api/parking-assignments`
   * **Command:** `RegisterParkingEntryCommand(Guid parkingSpotId, string licensePlate, string visitorName, string destinationUnit)`
   * **Response:** `201 Created` -> `ParkingAssignmentDto` or `409 Conflict` (if spot already occupied / concurrency clash) or `422 Unprocessable Entity` (if out of service or invalid plate).
3. `PUT /api/parking-assignments/{id}/checkout`
   * **Command:** `RegisterParkingCheckoutCommand(Guid id)`
   * **Response:** `200 OK` -> `ParkingAssignmentDto` (with calculated exit time and duration) or `404 Not Found` or `400 Bad Request`.
4. `GET /api/parking-assignments/active`
   * **Query:** `GetActiveAssignmentsQuery()`
   * **Response:** `200 OK` -> `List<ActiveAssignmentSummaryDto>`.

### 4.3 Automated Testing Requirements (xUnit + FluentAssertions)
* `ParkingSpotTests.cs`:
  1. `AssignSpot_WhenAvailable_ShouldSucceedAndMarkOccupied`
  2. `AssignSpot_WhenAlreadyOccupied_ShouldThrowDomainConflictException`
  3. `AssignSpot_WhenOutOfService_ShouldThrowInvalidOperationException`
  4. `CompleteCheckout_WhenActive_ShouldSetAvailableAndRecordExit`
  5. `CompleteCheckout_WhenExitDateBeforeEntry_ShouldFailTemporalRule`
  6. `LicensePlate_Normalization_ShouldSanitizeHyphensAndSpaces`
* `ConcurrencyIntegrationTests.cs`:
  * Spawn 10 simultaneous asynchronous HTTP requests trying to allocate spot `P-15`. Exactly 1 must succeed (`201 Created`), 9 must fail (`409 Conflict` or handled gracefully).

---

## 5. FRONTEND MICROFRONTENDS SPECIFICATION (SINGLE-SPA)

### 5.1 Architecture Diagram & Manifest
```text
+-------------------------------------------------------------------------------+
|                       Single-SPA Root Orchestrator (Port 9000)                |
|                    HTML Shell, Navigation Header, Auth, Shared Bus             |
+---------------------------------------+---------------------------------------+
| Route: /parking                       | Route: /analytics                     |
| Angular 19 MFE (Port 9001)            | Vue.js 3 MFE (Port 9002)              |
| - Live Grid (P01..P30)                | - Historical Demand Matrix            |
| - Entry Dialog / Modal                | - Peak Hour Predictive Model          |
| - Exit Processing                     | - Occupancy Trend Visualizations      |
+---------------------------------------+---------------------------------------+
|                 Shared Design System: @domonow/ui-tokens                      |
+-------------------------------------------------------------------------------+
```

### 5.2 Microfrontend Technical Contracts
1. **Root Orchestrator (`domonow-root`):**
   * Serves `index.html` loading SystemJS, `single-spa@6.x`, and Import Maps.
   * Defines the top-bar navigation featuring the DomoNow logo ("Domo" in `#6C35DE`, "Now" in `#0F172A`), property selector, and active route switchers.
2. **Angular MFE (`domonow-angular-parking`):**
   * Wrapped via `single-spa-angular`.
   * Displays the 30-spot parking grid with cards color-coded by state (Available, Occupied, Out of Service).
   * Reactive state managed via Angular Signals (`parkingSpots = signal<ParkingSpot[]>([])`).
   * Real-time refresh button + entry registration modal with license plate formatting mask.
3. **Vue MFE (`domonow-vue-analytics`):**
   * Wrapped via `single-spa-vue`.
   * Visualizes parking turnaround time, peak hours, and machine-learning predictive occupancy cards.

---

## 6. CONTAINERIZATION & MACOS PODMAN RUNBOOK

### 6.1 Podman Machine Setup (macOS Apple Silicon)
```bash
# Initialize and start podman machine with adequate resources for .NET 10 + Node MFEs
podman machine init --cpus 4 --memory 4096 --disk-size 50
podman machine start

# Verify socket and connectivity
podman system info
```

### 6.2 `podman-compose.yaml` Specification
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:17-alpine
    container_name: domonow-postgres
    environment:
      POSTGRES_DB: domonow_parking
      POSTGRES_USER: domonow_admin
      POSTGRES_PASSWORD: DomoNowSecure2026!
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U domonow_admin -d domonow_parking"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: podman/Containerfile.backend
    container_name: domonow-backend-api
    environment:
      ASPNETCORE_ENVIRONMENT: Development
      ConnectionStrings__DefaultConnection: "Host=postgres;Port=5432;Database=domonow_parking;Username=domonow_admin;Password=DomoNowSecure2026!"
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy

  root-mfe:
    build:
      context: src/frontend/root-config
      dockerfile: ../../../podman/Containerfile.root-mfe
    container_name: domonow-root-mfe
    ports:
      - "9000:9000"

  angular-mfe:
    build:
      context: src/frontend/domonow-angular-parking
      dockerfile: ../../../podman/Containerfile.angular-mfe
    container_name: domonow-angular-mfe
    ports:
      - "9001:9001"

  vue-mfe:
    build:
      context: src/frontend/domonow-vue-analytics
      dockerfile: ../../../podman/Containerfile.vue-mfe
    container_name: domonow-vue-mfe
    ports:
      - "9002:9002"

volumes:
  pgdata:
```

---

## 7. HIGH-SCALE ARCHITECTURAL EVOLUTION (5,000 PROPERTIES & 100K+ MOVEMENTS/DAY)

### 7.1 Distributed Multi-Tenant Architecture
* **Tenant Isolation Strategy:** Tenant discriminator (`TenantId` Guid) partitioned at database level, migrating to a Hybrid Database-per-Cluster strategy for enterprise high-tier properties.
* **Distributed Concurrency & Rate Limiting:**
  * Distributed locking via **Redis Redlock** keyed on `tenant:{id}:spot:{number}` to prevent race conditions prior to database touch.
  * Ingress rate limiting with Envoy / Azure API Management to prevent DDoS attacks on portería devices.
* **Event-Driven Asynchronous Pipeline:**
  * Operations emit domain events to **Apache Kafka / Azure Event Hubs** (topic: `domonow.parking.events`).
  * Microservices for Billing, resident notifications via Push & WhatsApp Business API, and automated analytics subscribe asynchronously without degrading API latency.
* **Read-Model CQRS with Redis & CQRS Projection:**
  * Parking spot availability query cached in Redis In-Memory Key-Value structures (`GEO` and `HASH` per property).
  * Cache invalidation orchestrated via Outbox Pattern to guarantee at-least-once message delivery.

---

## 8. PREDICTIVE AI DEMAND MODEL SPECIFICATION (ML OPTIONAL CHALLENGE)

### 8.1 Machine Learning Architecture
* **Objective:** Predict visitor parking demand probability and peak occupancy buckets per 1-hour window for each residential complex.
* **Feature Engineering:**
  * Temporal: Day of week, day of month, hour, holiday flag in Colombia, month.
  * Property Attributes: Total units, visitor-to-unit ratio, presence of event salon/social areas, reserved clubhouse events.
  * Lag Features: Rolling average occupancy of the last 4 weeks at identical hour slot.
* **Model Algorithm:** LightGBM / XGBoost Regressor for tabular demand forecasting, combined with an LSTM Neural Network for properties with high temporal fluctuation.
* **Serving & Operationalization (MLOps):**
  * Training pipeline scheduled weekly via GitHub Actions / Azure ML.
  * Exported to **ONNX Runtime** format and embedded directly into the .NET 10 Application using `Microsoft.ML.OnnxRuntime` for ultra-low latency sub-millisecond inference.
  * **Model Drift & Degradation Detection:** Kolmogorov-Smirnov test and Population Stability Index (PSI) monitored in Grafana comparing real occupancy distribution vs. predicted scores.

---

## 9. AI ENGINEERING PROTOCOL (`AI-USAGE.md`)

This repository documents and evaluates engineer-guided AI development:
* Case 1: High-concurrency race condition modeling and PostgreSQL partial index strategy.
* Case 2: Clean Architecture DDD Aggregate encapsulation vs. anemic entity refactoring.
* Case 3: Single-SPA routing and SystemJS cross-origin resource sharing (CORS) resolution.
* AI Automated Code Review: Critical triage of AI-suggested memory leaks, security assertions, and asynchronous execution patterns.
