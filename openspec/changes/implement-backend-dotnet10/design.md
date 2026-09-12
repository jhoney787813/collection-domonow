## Context

The DomoNow visitor parking subsystem requires a high-performance backend adhering to Clean Architecture and CQRS, migrating proven structure and patterns from `one-million-luxury-app-main` to modern **.NET 10 LTS (C# 14)** and **PostgreSQL 17**. See `proposal.md` for problem background and scope.

## Goals / Non-Goals

**Goals:**
- Target `.NET 10 LTS` with modern C# 14 features across 5 projects in `src/backend/`: `Domain`, `Application`, `Infrastructure`, `Api`, and `UnitTests`.
- Provide complete implementations for the 4 core CQRS endpoints (`GET /api/parking-spots`, `POST /api/parking-assignments`, `POST /api/parking-assignments/{id}/checkout`, `GET /api/parking-assignments/active`).
- Guarantee zero double-allocation under race conditions using both EF Core optimistic concurrency tokens (`xmin`) and PostgreSQL partial unique index `uq_parking_active_assignment`.
- Deploy PostgreSQL 17 in Podman with auto-initialization from `open-spec/06-database-ddl.sql` (seeding 30 communal spots `P-01` to `P-30`).
- Expose Swagger OpenAPI 3.1 documentation and enable CORS for ports 9000 (Root), 9001 (Angular), and 9002 (Vue).

**Non-Goals:**
- Modifying the legacy codebase in `one-million-luxury-app-main`.
- Implementing non-visitor parking modules (resident permits, charging stations, payment gateways).
- Altering the existing Single-SPA frontend contract specifications.

## Decisions

### Decision 1: .NET 10 LTS & Clean Architecture Topology
- **Choice**: Separate solution into 5 projects:
  - `DomoNow.Parking.Domain`: Zero external dependencies, pure business logic, rich entities, and domain exceptions.
  - `DomoNow.Parking.Application`: CQRS pattern with MediatR 12.4+, FluentValidation 11.10+, and pipeline validation behavior.
  - `DomoNow.Parking.Infrastructure`: EF Core 10, Npgsql 9.x/10.x, DbContext, and repository implementations.
  - `DomoNow.Parking.Api`: ASP.NET Core 10 Web API, RFC 7807 ProblemDetails middleware, Swagger OpenAPI, and health checks.
  - `DomoNow.Parking.UnitTests`: xUnit test suite for domain invariants and concurrency race simulation.
- **Alternatives Considered**: Vertical Slice Architecture without separate assemblies. Clean Architecture with explicit assemblies was chosen to preserve standard enterprise modularity matching `one-million-luxury-app-main`.

### Decision 2: Double-Layer Concurrency Control (Optimistic + Physical)
- **Choice**:
  1. EF Core entity configuration maps `xmin` system column as `[Timestamp]` / `.IsRowVersion()` on `ParkingSpot`.
  2. Database-level partial unique index:
     ```sql
     CREATE UNIQUE INDEX uq_parking_active_assignment 
     ON parking_assignments (parking_spot_id) 
     WHERE status = 1;
     ```
- **Rationale**: When 10 concurrent requests target the same spot `P-15`, exactly 1 transaction succeeds (HTTP 201) and 9 fail with HTTP 409 Conflict. Application-level locks fail across multiple container replicas, whereas physical partial unique indexes provide ACID guarantees at database engine level.

### Decision 3: Podman PostgreSQL 17 Setup
- **Choice**: Define `postgres-db` in `podman/podman-compose.yaml` using official image `docker.io/library/postgres:17-alpine`, mounting `../open-spec/06-database-ddl.sql` to `/docker-entrypoint-initdb.d/01-init.sql:ro`.
- **Rationale**: Automatic idempotency upon first container startup ensures the schema and the 30 initial spots are always present.

### Decision 4: Global Exception Handling & RFC 7807 Problem Details
- **Choice**: Implement custom middleware mapping domain exceptions to HTTP statuses:
  - `DomainValidationException` / `FluentValidation.ValidationException` -> 422 Unprocessable Entity (or 400 Bad Request for temporal ordering errors).
  - `NotFoundException` -> 404 Not Found.
  - `DomainConflictException` / `DbUpdateConcurrencyException` / Postgres error `23505` (unique violation) -> 409 Conflict.

## Risks / Trade-offs

- **[Risk]**: Local host running older .NET runtime or container runtime differences.
  → **Mitigation**: Verified host has `.NET SDK 10.0.401` installed. Podman Containerfile uses official Microsoft .NET 10 SDK & ASP.NET runtime Alpine images for uniform execution.
- **[Risk]**: First-run race condition if backend container boots before PostgreSQL is accepting connections.
  → **Mitigation**: Add `healthcheck` in `podman-compose.yaml` and EF Core resilient connection retry policy (`EnableRetryOnFailure`).
