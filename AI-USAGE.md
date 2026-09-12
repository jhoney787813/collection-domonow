# AI Usage Engineering Log (`AI-USAGE.md`)

<!--
  PROJECT: DomoNow PropTech Platform - Visitor Parking Management
  AUTHOR: Jhon Edison Hincapié García (Solutions Architect & Senior Full Stack Engineer)
  GOVERNANCE: Open Spec 1.0 Engineering Decision Records (EDRs)
-->

This document records the architectural dialogue, critical triage, and engineer-guided decisions made during the design and implementation of the DomoNow Visitor Parking Management system using AI agent assistance.

---

### EDR-001: High-Concurrency Race Condition & PostgreSQL Partial Index Strategy

* **Date:** 2026-09-12
* **Architect / Lead:** Jhon Edison Hincapié García
* **AI Toolchain:** Google Antigravity Agent / OpenSpec Engine
* **Component:** `DomoNow.Parking.Infrastructure` / PostgreSQL 17 Alpine

#### 1. Problem Statement & Context
During peak evening hours in high-density residential properties, multiple gatehouse security guards or automated license plate cameras can simultaneously trigger entry requests for the same available parking bay (e.g., spot P-15). A standard read-then-write approach (`if (spot.Status == Available) { spot.Status = Occupied; }`) is prone to classic race conditions ("phantom assignments"), leading to double bookings and physical traffic gridlock.

#### 2. AI Initial Proposal
The AI initially proposed applying an in-memory `SemaphoreSlim` lock inside the ASP.NET Core API controller or using a global C# `lock` statement around the assignment registration handler.

#### 3. Human Architect Critique & Risk Evaluation
* **Identified Flaws:** In-memory locking works solely within a single process instance. In a real-world multi-instance deployment (Kubernetes, Podman replicas, or horizontal auto-scaling), in-memory locks do not share state across containers, rendering the lock completely useless.
* **Scale Feasibility:** In high-scale distributed deployments (5,000 properties, 100K daily movements), data integrity must be guaranteed at the storage engine level, backed by mathematical constraints.

#### 4. Accepted Architectural Decision
A defense-in-depth approach was adopted:
1. **Optimistic Concurrency:** Entity Framework Core maps `ParkingSpot.RowVersion` to the PostgreSQL `xmin` system column.
2. **PostgreSQL Partial Unique Index:** An invariant constraint was created directly in PostgreSQL:
   ```sql
   CREATE UNIQUE INDEX uq_parking_active_assignment 
   ON parking_assignments (parking_spot_id) 
   WHERE status = 1; -- 1: Active
   ```
   Even if two requests pass all application-level checks at the exact millisecond, the database engine enforces serialization, committing one and raising error `23505` on the second.
3. **HTTP 409 Conflict Mapping:** The API exception handler intercepts unique constraint violations and returns an informative `ProblemDetails` with HTTP 409 Conflict.

#### 5. Code & Schema Validation Evidence
* **Schema Definition:** Configured in `open-spec/06-database-ddl.sql`.
* **Automated Test:** `ConcurrencyIntegrationTests.cs` dispatches 10 parallel asynchronous HTTP requests for spot P-15; exactly 1 completes with 201 Created and 9 return 409 Conflict.

---

### EDR-002: Clean Architecture DDD Aggregate Encapsulation vs. Anemic Entity

* **Date:** 2026-09-12
* **Architect / Lead:** Jhon Edison Hincapié García
* **AI Toolchain:** Google Antigravity Agent / OpenSpec Engine
* **Component:** `DomoNow.Parking.Domain` / `ParkingSpot` & `ParkingAssignment`

#### 1. Problem Statement & Context
Standard scaffolding tools often produce anemic data models with public getters and setters for all properties (e.g., `spot.Status = ParkingSpotStatus.Occupied`), spreading business validation logic across application services and controllers.

#### 2. AI Initial Proposal
The AI generated CRUD entity models where controllers directly set `assignment.ExitTime = DateTime.UtcNow` and `spot.Status = ParkingSpotStatus.Available`.

#### 3. Human Architect Critique & Risk Evaluation
* **Identified Flaws:** Anemic domain entities violate object-oriented encapsulation and DDD principles. Business rules (such as `ExitTime >= EntryTime` or forbidding allocation of `OutOfService` spots) can be bypassed by any developer modifying properties directly.

#### 4. Accepted Architectural Decision
Refactored `ParkingSpot` and `ParkingAssignment` into Rich Domain Aggregates:
1. All property setters are `private` or `internal init`.
2. State transitions are exclusively executed via expressive domain methods: `AssignSpot(...)`, `CompleteCheckout(...)`, `DecommissionSpot(...)`.
3. Invariants (Rules 1 to 6) are checked immediately inside entity constructors and domain methods, raising strongly-typed domain exceptions (`DomainValidationException`, `DomainConflictException`).
4. Primitive values are replaced with Value Objects (`LicensePlate`, `VisitorName`, `DestinationUnit`).

#### 5. Code & Schema Validation Evidence
* **Specification:** Formalized in `open-spec/01-domain-model.md`.
* **Unit Tests:** `ParkingSpotTests.cs` covering all 6 invariant edge cases.

---

### EDR-003: Single-SPA Routing & SystemJS Cross-Origin Resource Sharing (CORS)

* **Date:** 2026-09-12
* **Architect / Lead:** Jhon Edison Hincapié García
* **AI Toolchain:** Google Antigravity Agent / OpenSpec Engine
* **Component:** `src/frontend/root-config`, `domonow-angular-parking`, `domonow-vue-analytics`

#### 1. Problem Statement & Context
When running Single-SPA microfrontends locally across distinct development ports (Root Shell: 9000, Angular MFE: 9001, Vue MFE: 9002), the browser blocks dynamic module loading via SystemJS due to missing CORS headers and conflicting client-side routing history pushStates.

#### 2. AI Initial Proposal
The AI suggested disabling web security in Chrome during development or loading all microfrontends inside `<iframe>` tags.

#### 3. Human Architect Critique & Risk Evaluation
* **Identified Flaws:** Disabling browser security is an insecure anti-pattern that conceals production deployment issues. Iframes destroy seamless UX, shared state management, and unified styling, defeating the fundamental purpose of Single-SPA microfrontends.

#### 4. Accepted Architectural Decision
1. Explicitly configured development servers (Vite for Vue and Angular CLI dev-server) with proper CORS headers: `Access-Control-Allow-Origin: *`.
2. Implemented Single-SPA HTML import maps with SystemJS 6.x module loader in the root shell.
3. Decoupled cross-MFE communications using standard browser `CustomEvent` primitives (`domonow:spot-assigned`, `domonow:spot-released`), preventing direct module dependencies between Angular and Vue.

#### 5. Code & Schema Validation Evidence
* **Specification:** Formalized in `open-spec/04-microfrontends-spec.md`.

---

## AI Automated Code Review: Triage Log

| Date | Issue Flagged by AI Review | Severity | Architect Triage & Resolution |
| :--- | :--- | :--- | :--- |
| 2026-09-12 | Possible unhandled DbUpdateConcurrencyException in command pipeline | High | **Accepted:** Added explicit MediatR exception filter mapping DbUpdateConcurrencyException and Npgsql 23505 to RFC 7807 ProblemDetails (HTTP 409). |
| 2026-09-12 | Memory leak in Angular Signal effect / Vue watcher without unmount hook | Medium | **Accepted:** Ensured Single-SPA `unmount()` lifecycle cleanly cancels active HTTP subscriptions and disposes Signal effects. |
| 2026-09-12 | Regex denial of service (ReDoS) vulnerability on license plate pattern | Low | **Mitigated:** Replaced complex regex with strict bounded pattern `^[A-Z0-9]{5,8}$` with maximum length limit. |
