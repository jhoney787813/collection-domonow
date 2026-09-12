# Open Spec 00: System Overview & Platform Context

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

## 1. Executive Summary & Business Mission

The **DomoNow Visitor Parking Management System** is a mission-critical subsystem of the DomoNow PropTech platform. Its primary mission is to automate and streamline visitor parking operations within residential complexes, eliminating portería (gatehouse) bottlenecks, avoiding manual pen-and-paper tracking, and enforcing strict occupancy invariants.

### Key Objectives
* **Zero Double-Booking:** Mathematical guarantee against assigning occupied spots, even under peak arrival surges.
* **Instant Portería Workflow:** Average visitor check-in completed in under 15 seconds through auto-formatting and clear visual feedback.
* **High-Concurrency Resilience:** Guaranteed transactional isolation and deterministic outcome under simultaneous allocation attempts.
* **Real-Time Operational Visibility:** Single-pane dashboard displaying spot occupancy (P-01 to P-30) with sub-second status reflection.
* **Predictive Demand Intelligence:** Microfrontend dedicated to occupancy trends, peak hour identification, and ML-assisted demand forecasting.

---

## 2. Technical Stack & Development Toolchain

### 2.1 Host Environment
* **Host Operating System:** macOS 26.6.2 (Darwin 25G83), Apple Silicon (ARM64 architecture).
* **Container Virtualization:** Podman 5.x+ with rootless VM machine, native socket forwarding (`unix:///Users/$USER/.local/share/containers/podman/machine/podman.sock`).
* **Container Orchestration:** `podman-compose` with healthcheck dependencies and isolated bridge network.

### 2.2 Backend Architecture (.NET 10 LTS)
* **SDK / Framework:** .NET 10 SDK (v10.0.x-arm64), C# 14, ASP.NET Core Web API.
* **Architecture Pattern:** Clean Architecture + CQRS (Command Query Responsibility Segregation).
* **Data Access:** Entity Framework Core 10 with Npgsql provider, row-level optimistic concurrency (`xmin`), and advisory locking.
* **Database Engine:** PostgreSQL 17 Alpine executing in rootless Podman container.
* **Testing:** xUnit, FluentAssertions, integration test harnesses testing 10 parallel allocation races.

### 2.3 Frontend Microfrontends Architecture (Single-SPA Monorepo)
* **Root Orchestrator (`domonow-root` - Port 9000):** Vanilla TypeScript / HTML5 shell loader, `@single-spa/layout`, SystemJS import maps, top-bar navigation and auth context.
* **Operations MFE (`domonow-angular-parking` - Port 9001):** Angular 19+ (Standalone Components, Signals, OnPush change detection, Zone-less/light Zone).
* **Analytics MFE (`domonow-vue-analytics` - Port 9002):** Vue.js 3+ (Composition API, `<script setup>`, Pinia, Vite).
* **Shared Design System (`@domonow/ui-tokens`):** Shared CSS tokens library, brand color `#6C35DE`, and Plus Jakarta Sans / Inter typography.

---

## 3. High-Level Architectural Diagram

```text
                               +---------------------------------------------------+
                               |              Client Web Browser                   |
                               +---------------------------------------------------+
                                                         |
                                                         v
                               +---------------------------------------------------+
                               |     Single-SPA Root Orchestrator (Port 9000)      |
                               |    - SystemJS Import Maps / Shared Auth Context   |
                               +-------------------------+-------------------------+
                                                         |
                                 +-----------------------+-----------------------+
                                 |                                               |
                                 v                                               v
             +---------------------------------------+       +---------------------------------------+
             |      MFE 1: Angular 19 Parking        |       |       MFE 2: Vue 3 Analytics          |
             |              (Port 9001)              |       |              (Port 9002)              |
             | - Spot Grid (P-01 to P-30)            |       | - Demand Matrix                       |
             | - Entry Modal & License Mask          |       | - Peak Hour Analysis                  |
             | - Checkout Management                 |       | - Predictive ML Trends                |
             +-------------------+-------------------+       +-------------------+-------------------+
                                 |                                               |
                                 +-----------------------+-----------------------+
                                                         | HTTP REST / JSON
                                                         v
                               +---------------------------------------------------+
                               |            Backend API (.NET 10 LTS)              |
                               |                   (Port 5000)                     |
                               | - Clean Architecture & CQRS Pipeline              |
                               | - Optimistic Concurrency + Lock Coordinator       |
                               +-------------------------+-------------------------+
                                                         |
                                                         v
                               +---------------------------------------------------+
                               |            PostgreSQL 17 Alpine                   |
                               |                   (Port 5432)                     |
                               | - Partial Unique Index `uq_parking_active_assignment`|
                               | - Explicit Isolation & Advisory Locks             |
                               +---------------------------------------------------+
```

---

## 4. Scalability Vision: 5,000 Properties & 100K+ Daily Movements

The architecture is designed to evolve into a multi-tenant distributed cloud infrastructure:
1. **Tenant Isolation:** Tenant discriminator (`TenantId` Guid) partitioned at DB level, transitioning to database-per-cluster for enterprise tier.
2. **Distributed Locking:** Redis Redlock keyed on `tenant:{id}:spot:{number}` to guard critical sections prior to DB transactions.
3. **Asynchronous Event Stream:** Domain events dispatched to Apache Kafka / Azure Event Hubs (`domonow.parking.events`) for billing, notifications (WhatsApp Business API / Push), and analytics.
4. **Predictive ONNX Runtime:** Embedded ML scoring model (`Microsoft.ML.OnnxRuntime`) predicting occupancy probabilities in sub-millisecond windows.
