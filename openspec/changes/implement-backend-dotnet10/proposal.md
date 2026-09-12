## Why

DomoNow requires a robust, high-performance .NET 10 LTS backend service (`DomoNow.Parking.Api`) to replace mock data and fully back the visitor parking operations and analytics microfrontends. A production-ready PostgreSQL 17 database container running in Podman is required to enforce data integrity, ACID transactions, and concurrency guarantees for spot assignments.

## What Changes

- **PostgreSQL 17 Database Container**: Configured in Podman Compose with persistent initialization from `open-spec/06-database-ddl.sql`, creating the 30-spot seed (`P-01` to `P-30`) and the partial unique index `uq_parking_active_assignment`.
- **Backend Clean Architecture & CQRS**: Implemented in `src/backend/` targeting `.NET 10 LTS` (C# 14), migrating patterns from `one-million-luxury-app-main` (Domain, Application, Infrastructure, API, UnitTests).
- **Domain Layer (`DomoNow.Parking.Domain`)**: Rich aggregates `ParkingSpot` and `ParkingAssignment`, Value Objects (`LicensePlate`, `DestinationUnit`), strict domain invariants and exceptions.
- **Application Layer (`DomoNow.Parking.Application`)**: MediatR CQRS handlers, FluentValidation rules, and pipeline behaviors for:
  - `GetParkingSpotsQuery`
  - `RegisterParkingEntryCommand`
  - `RegisterParkingCheckoutCommand`
  - `GetActiveAssignmentsQuery`
- **Infrastructure Layer (`DomoNow.Parking.Infrastructure`)**: Entity Framework Core 10 with Npgsql provider, PostgreSQL `xmin` concurrency token mapping, and resilient database context.
- **API Layer (`DomoNow.Parking.Api`)**: ASP.NET Core 10 Web API, RFC 7807 `ProblemDetails` exception handling middleware, CORS policies for frontend ports (9000, 9001, 9002), and OpenAPI 3.1 Swagger docs.
- **Unit & Concurrency Tests (`DomoNow.Parking.UnitTests`)**: Automated validation of domain rules, temporal checkout validation, and 10 concurrent requests to spot `P-15` (1 HTTP 201, 9 HTTP 409).
- **Containerization**: Podman Containerfile and Compose definitions for containerized backend execution and database connectivity.

## Capabilities

### New Capabilities
<!-- None: The capability is already specified in openspec/specs/visitor-parking/spec.md -->

### Modified Capabilities
<!-- None: The specification requirements in openspec/specs/visitor-parking/spec.md remain unchanged and are strictly adhered to -->

## Impact

- **Database**: PostgreSQL 17 instance running on port 5432 with schema `domonow_parking`.
- **Backend**: New solution `src/backend/DomoNow.Parking.sln` (.NET 10 LTS) running on port 5000.
- **Frontend**: Single-SPA shell and MFEs (Angular 9001, Vue 9002) can connect to live REST endpoints with full CORS support.
- **DevOps**: `podman/podman-compose.yaml` updated with `postgres-db` and `backend-api`.
