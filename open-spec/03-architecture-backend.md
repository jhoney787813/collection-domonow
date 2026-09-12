# Open Spec 03: Backend Architecture Specification (.NET 10 LTS)

<!--
  SPEC-METADATA:
  Subsystem: DomoNow Visitor Parking Backend API
  Runtime: .NET 10 SDK (C# 14), ASP.NET Core
  Pattern: Clean Architecture, CQRS, MediatR, EF Core 10
-->

---

## 1. Clean Architecture Solution Topology

The backend strictly segregates concerns according to Clean Architecture principles, ensuring the Domain layer has zero external dependencies.

```text
src/backend/
├── DomoNow.Parking.Domain/              # Pure C# 14: Core Entities, Value Objects, Domain Events, Invariants
├── DomoNow.Parking.Application/         # CQRS Commands/Queries, MediatR Handlers, DTOs, FluentValidation
├── DomoNow.Parking.Infrastructure/      # EF Core DbContext, Npgsql, Migrations, Repositories, Redis Cache
├── DomoNow.Parking.Api/                 # ASP.NET Core Minimal APIs/Controllers, Middleware, OpenAPI Docs
└── DomoNow.Parking.UnitTests/           # xUnit + FluentAssertions Unit & Concurrency Integration Tests
```

### Dependency Inversion Rule
```text
[ DomoNow.Parking.Api ] ---> [ DomoNow.Parking.Application ] <--- [ DomoNow.Parking.Infrastructure ]
                                       |
                                       v
                             [ DomoNow.Parking.Domain ]
```

---

## 2. CQRS Pattern & Application Pipelines

The Application layer implements CQRS using MediatR with pipeline behaviors for validation and exception handling.

### 2.1 CQRS Operations Summary

| Operation Type | Name | Parameters / Payload | Expected Output | Error Codes |
| :--- | :--- | :--- | :--- | :--- |
| **Query** | `GetParkingSpotsQuery` | `ParkingSpotStatus? StatusFilter` | `IReadOnlyList<ParkingSpotDto>` | `200 OK` |
| **Command** | `RegisterParkingEntryCommand` | `Guid ParkingSpotId`, `string LicensePlate`, `string VisitorName`, `string DestinationUnit` | `ParkingAssignmentDto` | `201 Created`, `400 Bad Request`, `409 Conflict`, `422 Unprocessable` |
| **Command** | `RegisterParkingCheckoutCommand` | `Guid AssignmentId` | `ParkingAssignmentDto` | `200 OK`, `400 Bad Request`, `404 Not Found` |
| **Query** | `GetActiveAssignmentsQuery` | None | `IReadOnlyList<ActiveAssignmentSummaryDto>` | `200 OK` |

### 2.2 MediatR Pipeline Behaviors
1. **`ValidationBehavior<TRequest, TResponse>`:** Pre-validates commands using FluentValidation. Catches missing fields, invalid length, or unparseable license plates before touching domain logic.
2. **`LoggingAndPerformanceBehavior<TRequest, TResponse>`:** Measures handler execution time and emits structured logs (trace IDs for distributed request tracking).
3. **`TransactionBehavior<TRequest, TResponse>`:** Wraps command execution in an explicit database transaction with appropriate isolation level.

---

## 3. Data Persistence & Concurrency Strategy

### 3.1 Entity Framework Core 10 Configuration
* **PostgreSQL Provider:** `Npgsql.EntityFrameworkCore.PostgreSQL`.
* **Optimistic Concurrency Token:** Configured via PostgreSQL system column `xmin`:
  ```csharp
  modelBuilder.Entity<ParkingSpot>()
      .Property<uint>("RowVersion")
      .IsRowVersion();
  ```
* **Table Mappings:**
  * `ParkingSpot` maps to table `parking_spots`.
  * `ParkingAssignment` maps to table `parking_assignments`.

### 3.2 Concurrency Defense in Depth
1. **Application Optimistic Lock:** If two concurrent transactions read the same spot version and both attempt to write `Status = Occupied`, the second transaction fails with `DbUpdateConcurrencyException`.
2. **Database Invariant Guarantee:** The database partial unique index:
   ```sql
   CREATE UNIQUE INDEX uq_parking_active_assignment 
   ON parking_assignments (parking_spot_id) 
   WHERE status = 1;
   ```
   guarantees that even under zero application-level locking or distributed multi-node clustering, PostgreSQL physically rejects any duplicate active assignment.
3. **Exception Mapping:** The global `ExceptionHandlingMiddleware` translates `DbUpdateConcurrencyException` and PostgreSQL unique constraint violation error `23505` into HTTP 409 Conflict (`ProblemDetails`).

---

## 4. Automated Testing Requirements

### 4.1 Unit Tests (`ParkingSpotTests.cs` using xUnit + FluentAssertions)
1. `AssignSpot_WhenAvailable_ShouldSucceedAndMarkOccupied`: Validates state transition from `Available` to `Occupied` and creation of assignment with UTC timestamp.
2. `AssignSpot_WhenAlreadyOccupied_ShouldThrowDomainConflictException`: Confirms aggregate rejects double assignment with domain exception.
3. `AssignSpot_WhenOutOfService_ShouldThrowInvalidOperationException`: Confirms aggregate forbids allocating disabled spots.
4. `CompleteCheckout_WhenActive_ShouldSetAvailableAndRecordExit`: Validates exit timestamp, status `Completed`, and spot returning to `Available`.
5. `CompleteCheckout_WhenExitDateBeforeEntry_ShouldFailTemporalRule`: Confirms temporal guard raises domain validation error.
6. `LicensePlate_Normalization_ShouldSanitizeHyphensAndSpaces`: Verifies "abc-123", " ABC 123 ", and "abc.123" all normalize to "ABC123".

### 4.2 Concurrency Integration Tests (`ConcurrencyIntegrationTests.cs`)
* **Scenario:** Initialize spot "P-15" as `Available`.
* **Action:** Dispatch 10 simultaneous asynchronous HTTP POST requests to `/api/parking-assignments` targeting spot "P-15" via `Task.WhenAll(requests)`.
* **Assertions:**
  * Exactly 1 request completes with HTTP `201 Created`.
  * Exactly 9 requests fail with HTTP `409 Conflict`.
  * Database query confirms exactly 1 active assignment row exists for spot "P-15".
