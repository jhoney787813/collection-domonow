## 1. Database & Podman Container Setup

- [x] 1.1 Configure PostgreSQL 17 service in `podman/podman-compose.yaml` with schema initialization from `open-spec/06-database-ddl.sql` and verify YAML syntax
- [x] 1.2 Start PostgreSQL container via podman compose and verify database `domonow_parking`, 30 seeded spots (`P-01` to `P-30`), and partial unique index `uq_parking_active_assignment`

## 2. Backend Clean Architecture & Domain Layer

- [x] 2.1 Scaffold `src/backend/DomoNow.Parking.sln` with .NET 10 LTS projects (`Domain`, `Application`, `Infrastructure`, `Api`, `UnitTests`) and verify project references and build
- [x] 2.2 Implement Domain entities (`ParkingSpot`, `ParkingAssignment`), Value Objects (`LicensePlate`), Enums, and Domain Exceptions (`DomainConflictException`, `DomainValidationException`) in `DomoNow.Parking.Domain`

## 3. Application CQRS & Pipeline Behaviors

- [x] 3.1 Implement MediatR Queries and Commands (`GetParkingSpotsQuery`, `RegisterParkingEntryCommand`, `RegisterParkingCheckoutCommand`, `GetActiveAssignmentsQuery`) with FluentValidation validators
- [x] 3.2 Implement MediatR `ValidationBehavior` pipeline and dependency injection extension `AddApplicationLayer` in `DomoNow.Parking.Application`

## 4. Infrastructure & EF Core 10 Database Mapping

- [x] 4.1 Implement `ParkingDbContext` with fluent entity configurations, PostgreSQL `xmin` optimistic concurrency mapping, and partial unique index in `DomoNow.Parking.Infrastructure`
- [x] 4.2 Implement repository contracts and DI registration `AddInfrastructureLayer` connecting to PostgreSQL `domonow_parking`

## 5. API Layer & Global Exception Middleware

- [x] 5.1 Implement REST endpoints for visitor parking operations (`/api/parking-spots`, `/api/parking-assignments`, `/api/parking-assignments/{id}/checkout`, `/api/parking-assignments/active`)
- [x] 5.2 Configure RFC 7807 ProblemDetails Global Exception Handling Middleware, Swagger OpenAPI 3.1 documentation, and CORS for origins `http://localhost:9000`, `http://localhost:9001`, `http://localhost:9002`

## 6. Testing & Concurrency Validation

- [x] 6.1 Implement Unit Tests for Domain invariants and temporal checkout validation (`ExitTime >= EntryTime`) in `DomoNow.Parking.UnitTests`
- [x] 6.2 Implement Concurrency Race Test simulating 10 concurrent requests to spot `P-15` asserting 1 HTTP 201 Created and 9 HTTP 409 Conflict, and verify with `dotnet test`

## 7. Containerization & Documentation

- [x] 7.1 Create `podman/Containerfile.backend` and integrate `backend-api` service in `podman/podman-compose.yaml`
- [x] 7.2 Document database connection, DDL execution, and API operational steps in `README.md`
