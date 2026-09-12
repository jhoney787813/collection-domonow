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

## 4. Podman Machine & Contenedores (PostgreSQL 17 + .NET 10 Backend + MFEs)

### 4.1 Iniciar Podman Machine (macOS Apple Silicon)
```bash
# Inicializar y arrancar podman machine
podman machine init --cpus 4 --memory 4096 --disk-size 50
podman machine start

# Verificar conectividad de Podman
podman system info
```

### 4.2 Despliegue de Base de Datos y Backend con Podman Compose
El archivo [podman/podman-compose.yaml](podman/podman-compose.yaml) orquesta toda la plataforma con auto-inicialización de la base de datos PostgreSQL 17:

```bash
# Levantar todos los servicios en segundo plano
podman compose -f podman/podman-compose.yaml up -d --build

# O iniciar individualmente la base de datos y la API:
podman compose -f podman/podman-compose.yaml up -d postgres-db
podman compose -f podman/podman-compose.yaml up -d --build backend-api
```

### 4.3 Configuración y Conexión a la Base de Datos PostgreSQL 17
* **Imagen:** `postgres:17-alpine`
* **Contenedor:** `domonow-postgres-db`
* **Host / Puerto:** `localhost:5432`
* **Base de Datos:** `domonow_parking`
* **Usuario:** `domonow_user`
* **Contraseña:** `domonow_secret_pass`
* **Cadena de Conexión:**
  ```text
  Host=localhost;Port=5432;Database=domonow_parking;Username=domonow_user;Password=domonow_secret_pass;Include Error Detail=true
  ```
* **Inicialización DDL Automática:**
  El archivo [open-spec/06-database-ddl.sql](open-spec/06-database-ddl.sql) se monta en `/docker-entrypoint-initdb.d/01-init.sql:ro`, garantizando que en el primer arranque se creen:
  - Tablas: `parking_spots` y `parking_assignments`.
  - Índice Único Parcial: `uq_parking_active_assignment` (`WHERE status = 1`), asegurando matemáticamente a nivel de motor ACID que un cupo nunca tenga más de una asignación activa simultánea.
  - Seed Data: 30 cupos comunales precargados (`P-01` a `P-30`) en estado Disponible (`1`).

Para verificar directamente en PostgreSQL:
```bash
podman exec -it domonow-postgres-db psql -U domonow_user -d domonow_parking -c "SELECT spot_number, status FROM parking_spots ORDER BY spot_number LIMIT 5;"
```

---

## 5. Backend .NET 10 LTS (Clean Architecture & CQRS)

Ubicado en `src/backend/`, implementa Clean Architecture segregando responsabilidades sin dependencias acopladas:

```text
src/backend/
├── DomoNow.Parking.sln
├── DomoNow.Parking.slnx
├── DomoNow.Parking.Domain/              # .NET 10 / C# 14 puro: Agregados ParkingSpot y ParkingAssignment, Value Objects LicensePlate/DestinationUnit, Enums y Excepciones
├── DomoNow.Parking.Application/         # CQRS con MediatR 12.4+, FluentValidation, Pipeline Behaviors (ValidationBehavior) y DTOs
├── DomoNow.Parking.Infrastructure/      # EF Core 10 con Npgsql, mapeo de columna xmin (concurrencia optimista), índice uq_parking_active_assignment y Repositorios
├── DomoNow.Parking.Api/                 # ASP.NET Core 10 Web API, Middleware RFC 7807 ProblemDetails, Swagger OpenAPI 3.1 y CORS
└── DomoNow.Parking.UnitTests/           # xUnit + FluentAssertions: 16 pruebas automatizadas (6 invariantes de dominio y test de carrera concurrente de 10 peticiones sobre P-15)
```

### 5.1 Compilación y Pruebas
```bash
# Restaurar y compilar la solución
dotnet build src/backend/DomoNow.Parking.sln -c Release

# Ejecutar la suite completa de pruebas unitarias y de concurrencia
dotnet test src/backend/DomoNow.Parking.UnitTests/DomoNow.Parking.UnitTests.csproj
```

### 5.2 Endpoints REST y Documentación Swagger
* **Swagger UI Interactivo:** `http://localhost:5050/swagger`
* **GET `/api/parking-spots`:** Consulta inventario de 30 cupos con filtro opcional (`?statusFilter=1|2|3`).
* **POST `/api/parking-assignments`:** Asignación de cupo a visitante (valida placa `^[A-Z0-9]{5,8}$` y estado del cupo).
* **POST `/api/parking-assignments/{id}/checkout`:** Registro de salida y reconciliación (valida `ExitTime >= EntryTime` retornando HTTP 400 en caso contrario, y libera el cupo a Disponible).
* **GET `/api/parking-assignments/active`:** Consulta de vehículos activos en parqueadero con minutos transcurridos.

---

## 6. Mapeo de Puertos y Servicios

| Servicio | Tecnología | Puerto Host | Puerto Contenedor | URL de Acceso |
| :--- | :--- | :--- | :--- | :--- |
| **Root Shell MFE** | Single-SPA / Vanilla TS | `9000` | `9000` | `http://localhost:9000` |
| **Operations MFE** | Angular 19+ Standalone | `9001` | `9001` | `http://localhost:9001` |
| **Analytics MFE** | Vue 3+ Composition API | `9002` | `9002` | `http://localhost:9002` |
| **Backend API** | .NET 10 LTS ASP.NET Core | `5050` | `5000` | `http://localhost:5050/swagger` |
| **Database** | PostgreSQL 17 Alpine | `5432` | `5432` | `localhost:5432` (`domonow_parking`) |

*(Nota: El puerto de host del Backend API está mapeado a `5050` para evitar colisiones con el servicio AirPlay Receiver propio de macOS en el puerto `5000`)*.

---

## 7. Documentación Técnica de Arquitectura (C4 Model & Draw.io)

Consulte la documentación técnica formal completa y las justificaciones de ingeniería en:
* 📘 [docs/architecture/README.md](docs/architecture/README.md): Documento técnico maestro con justificación arquitectónica en lenguaje natural (Microfrontends Single-SPA, Angular 19 vs Vue 3, CQRS y Vertical Slice Architecture) y diagramas Mermaid interactivos.
* 📊 [c4-architecture.drawio](docs/architecture/c4-architecture.drawio): Diagrama maestro multi-pestaña en formato nativo Draw.io (Diagrams.net).
* 🌐 [c4-context.drawio](docs/architecture/c4-context.drawio): C4 Nivel 1 - Diagrama de Contexto del Sistema.
* 📦 [c4-containers.drawio](docs/architecture/c4-containers.drawio): C4 Nivel 2 - Diagrama de Contenedores.
* 🧩 [c4-components.drawio](docs/architecture/c4-components.drawio): C4 Nivel 3 - Diagrama de Componentes (Frontend y Backend Vertical Slices).


