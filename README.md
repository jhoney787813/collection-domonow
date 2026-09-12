# DomoNow PropTech Platform - Visitor Parking Management System

[![Open Spec](https://img.shields.io/badge/Open%20Spec-v1.0-blueviolet)](open-spec/00-system-overview.md)
[![.NET](https://img.shields.io/badge/.NET-10.0%20LTS-512BD4)](open-spec/03-architecture-backend.md)
[![Single-SPA](https://img.shields.io/badge/Frontend-Single--SPA%20Microfrontends-F15B2A)](open-spec/04-microfrontends-spec.md)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2017%20Alpine-336791)](open-spec/06-database-ddl.sql)
[![Podman](https://img.shields.io/badge/Container-Podman%205.x%20ARM64-892CA0)](podman/podman-compose.yaml)

> **Architect & Lead:** Jhon Edison Hincapié García (Solutions Architect & Senior Full Stack Engineer)  
> **Host Environment:** macOS 26.6.2 (Darwin Kernel 25G83, Apple Silicon ARM64)  
> **Specification Engine:** OpenSpec 1.0 CLI (`@fission-ai/openspec`) / Google Antigravity Agent

---

## 1. Project Overview & Architecture

The **DomoNow Visitor Parking Management System** automates and controls physical vehicle access to residential properties. It enforces strict concurrency invariants to eliminate double-booking of visitor parking spots (P-01 to P-30), accelerates gatehouse check-ins, and delivers real-time occupancy metrics and predictive demand intelligence.

### High-Level Architecture Topology
```text
collection-domonow/
├── .agent/                             # Antigravity agent instructions and validation rules
│   ├── rules.yaml
│   └── workflows.yaml
├── .agents/                            # OpenSpec Antigravity workflows and skills (CLI opsx-*)
├── open-spec/                          # Open Spec formal specifications (v1.0)
│   ├── 00-system-overview.md
│   ├── 01-domain-model.md
│   ├── 02-contracts-api.yaml           # OpenAPI 3.1 contract
│   ├── 03-architecture-backend.md
│   ├── 04-microfrontends-spec.md
│   ├── 05-design-tokens.json           # DomoNow visual system tokens
│   ├── 06-database-ddl.sql             # PostgreSQL 17 schema + partial unique index
│   └── 07-ai-usage-template.md         # Template for logging AI engineering decisions
├── openspec/                           # OpenSpec toolchain directory (@fission-ai/openspec)
│   ├── config.yaml                     # Project context and per-artifact rules
│   └── specs/
│       └── visitor-parking/
│           └── spec.md                 # Native capability spec (Requirements & Scenarios)
├── podman/                             # Containerization specifications
│   ├── Containerfile.backend
│   ├── Containerfile.root-mfe
│   ├── Containerfile.angular-mfe
│   ├── Containerfile.vue-mfe
│   └── podman-compose.yaml
├── src/                                # Source code monorepo
│   ├── backend/                        # .NET 10 Clean Architecture
│   └── frontend/                       # Single-SPA Microfrontends Monorepo
├── AI-USAGE.md                         # Mandatory AI engineering decisions log
└── README.md                           # Master orchestration and execution guide
```

---

## 2. OpenSpec Specification Suite

The formal specifications in `open-spec/` provide an exhaustive blueprint for implementation:

* [00-system-overview.md](open-spec/00-system-overview.md): System mission, tech stack, and multi-tenant scaling vision.
* [01-domain-model.md](open-spec/01-domain-model.md): DDD Aggregate Roots (`ParkingSpot`, `ParkingAssignment`), Value Objects, Domain Events, and 6 Invariant Rules.
* [02-contracts-api.yaml](open-spec/02-contracts-api.yaml): OpenAPI 3.1 REST contract covering all CRUD/CQRS endpoints and error schemas.
* [03-architecture-backend.md](open-spec/03-architecture-backend.md): .NET 10 Clean Architecture, MediatR CQRS pipelines, and concurrency defense-in-depth.
* [04-microfrontends-spec.md](open-spec/04-microfrontends-spec.md): Single-SPA root orchestrator (Port 9000), Angular 19 parking operations (Port 9001), and Vue 3 analytics (Port 9002).
* [05-design-tokens.json](open-spec/05-design-tokens.json): DomoNow brand colors (`#6C35DE`), typography, status indicators, and elevation tokens.
* [06-database-ddl.sql](open-spec/06-database-ddl.sql): PostgreSQL 17 DDL with the partial unique index `uq_parking_active_assignment` and initial 30-spot seed data.
* [07-ai-usage-template.md](open-spec/07-ai-usage-template.md): Engineering Decision Record (EDR) protocol for logging AI-guided architecture.
* [visitor-parking/spec.md](openspec/specs/visitor-parking/spec.md): OpenSpec CLI normative requirements with WHEN/THEN test scenarios.

---

## 3. OpenSpec CLI Commands

The project is fully integrated with `@fission-ai/openspec`:

```bash
# Validate all capability specifications
openspec validate --specs

# Check OpenSpec environment and relationship health
openspec doctor

# List registered specifications
openspec list --specs

# Inspect the visitor parking capability spec
openspec show visitor-parking --type spec

# Start a new change proposal
/opsx-propose "add-reservation-feature"
# or via CLI:
openspec new change add-reservation-feature
```

---

## 4. Podman Machine Setup (macOS Apple Silicon)

```bash
# Initialize and start podman machine with adequate resources
podman machine init --cpus 4 --memory 4096 --disk-size 50
podman machine start

# Verify podman socket
podman system info

# Launch the complete local stack
podman-compose -f podman/podman-compose.yaml up -d
```

### Port Mapping Summary
* **Root Shell (Single-SPA):** `http://localhost:9000`
* **Angular 19 Parking MFE:** `http://localhost:9001`
* **Vue 3 Analytics MFE:** `http://localhost:9002`
* **Backend API (.NET 10):** `http://localhost:5000` (Swagger UI: `http://localhost:5000/swagger`)
* **PostgreSQL 17 Database:** `localhost:5432` (`domonow_parking`)

---

## 5. Technical Architecture Documentation (C4 Model & Draw.io)

Consulte la documentación técnica formal completa y las justificaciones de ingeniería en:
* 📘 [docs/architecture/README.md](docs/architecture/README.md): Documento técnico maestro con justificación arquitectónica en lenguaje natural (Microfrontends Single-SPA, Angular 19 vs Vue 3, CQRS y Vertical Slice Architecture) y diagramas Mermaid interactivos.
* 📊 [c4-architecture.drawio](docs/architecture/c4-architecture.drawio): Diagrama maestro multi-pestaña en formato nativo Draw.io (Diagrams.net).
* 🌐 [c4-context.drawio](docs/architecture/c4-context.drawio): C4 Nivel 1 - Diagrama de Contexto del Sistema.
* 📦 [c4-containers.drawio](docs/architecture/c4-containers.drawio): C4 Nivel 2 - Diagrama de Contenedores.
* 🧩 [c4-components.drawio](docs/architecture/c4-components.drawio): C4 Nivel 3 - Diagrama de Componentes (Frontend y Backend Vertical Slices).

