# Open Spec 01: Domain-Driven Design (DDD) Specification

<!--
  SPEC-METADATA:
  Subsystem: DomoNow Visitor Parking Management
  Layer: Domain Core (DomoNow.Parking.Domain)
  Compliance: DDD, Rich Domain Model, Clean Architecture
-->

---

## 1. Ubiquitous Language Glossary

| Term | Definition | Ubiquitous Context |
| :--- | :--- | :--- |
| **ParkingSpot (Cupo de Parqueadero)** | Physical space designated for visitor parking identified by code (e.g., "P-01"). | Aggregate Root maintaining operational availability state. |
| **ParkingAssignment (Asignación)** | Active or historical record connecting a visitor vehicle to a specific parking spot. | Aggregate Root / Entity controlling access duration and metadata. |
| **LicensePlate (Placa Vehicular)** | Normalized alphanumeric identifier of the visitor's vehicle. | Immutable Value Object strictly formatted (Colombian and international standard). |
| **VisitorName (Nombre de Visitante)** | Full name of the driver entering the complex. | Immutable Value Object validated for minimum/maximum bounds. |
| **DestinationUnit (Unidad Destino)** | Specific apartment, office, or residential unit visited. | Immutable Value Object specifying physical destination (e.g., "Torre 2 - Apt 402"). |
| **EntryTime (Hora de Ingreso)** | UTC timestamp when the visitor physically passes gatehouse and occupies spot. | Temporal domain attribute. |
| **ExitTime (Hora de Salida)** | UTC timestamp when the visitor departs and releases the spot. | Nullable temporal domain attribute, must satisfy `ExitTime >= EntryTime`. |
| **Active Assignment (Asignación Activa)** | An assignment with status `Active` (1), representing ongoing spot occupancy. | Key invariant subject to partial unique constraint. |

---

## 2. Core Entities & Aggregate Roots

### 2.1 `ParkingSpot` (Aggregate Root)
Represents the designated parking bay in the complex.

```text
+-------------------------------------------------------------+
|                     ParkingSpot (Entity)                    |
+-------------------------------------------------------------+
| - Id: Guid                                                  |
| - SpotNumber: string (e.g., "P-01", "P-15")                 |
| - Status: ParkingSpotStatus (Enum: Available, Occupied, ...)|
| - RowVersion: uint (PostgreSQL xmin concurrency token)      |
+-------------------------------------------------------------+
| + AssignSpot(visitorData, plate, unit): ParkingAssignment   |
| + ReleaseSpot(): void                                       |
| + DecommissionSpot(reason): void                            |
| + ReinstateSpot(): void                                     |
+-------------------------------------------------------------+
```

* **Attributes:**
  * `Id`: `Guid` (Primary Key, UUID v4).
  * `SpotNumber`: `string` (Unique, max 20 chars, e.g., "P-01").
  * `Status`: `ParkingSpotStatus` Enum (`Available = 1`, `Occupied = 2`, `OutOfService = 3`).
  * `RowVersion`: `uint` (EF Core shadow/explicit concurrency token mapped to PostgreSQL `xmin`).

### 2.2 `ParkingAssignment` (Aggregate Root / Entity)
Represents the visit duration and visitor identity.

```text
+-------------------------------------------------------------+
|                  ParkingAssignment (Entity)                 |
+-------------------------------------------------------------+
| - Id: Guid                                                  |
| - ParkingSpotId: Guid (Foreign Key -> ParkingSpot)          |
| - LicensePlate: LicensePlate (Value Object)                 |
| - VisitorName: VisitorName (Value Object)                   |
| - DestinationUnit: DestinationUnit (Value Object)           |
| - EntryTime: DateTimeOffset (UTC)                           |
| - ExitTime: DateTimeOffset? (UTC, nullable)                 |
| - Status: AssignmentStatus (Enum: Active = 1, Completed = 2)|
+-------------------------------------------------------------+
| + CompleteCheckout(exitTimeUtc: DateTimeOffset): TimeSpan   |
| + CancelAssignment(reason: string): void                    |
+-------------------------------------------------------------+
```

---

## 3. Value Objects

### 3.1 `LicensePlate`
* **Invariant:** Alphanumeric uppercase string between 5 and 8 characters (`^[A-Z0-9]{5,8}$`).
* **Normalization Logic:**
  ```csharp
  public static LicensePlate Create(string rawInput)
  {
      if (string.IsNullOrWhiteSpace(rawInput))
          throw new DomainValidationException("License plate cannot be empty.");

      // Remove hyphens, spaces, dots, and convert to uppercase
      string sanitized = Regex.Replace(rawInput.Trim().ToUpperInvariant(), @"[\s\-\.]", "");

      if (!Regex.IsMatch(sanitized, @"^[A-Z0-9]{5,8}$"))
          throw new DomainValidationException($"Invalid license plate format: '{rawInput}'.");

      return new LicensePlate(sanitized);
  }
  ```

### 3.2 `VisitorName`
* **Invariant:** Trimmed string, length between 2 and 100 characters. Rejects empty or special character strings.

### 3.3 `DestinationUnit`
* **Invariant:** Trimmed non-empty string representing apartment/unit identifier (max 100 characters).

---

## 4. Domain Events

1. **`ParkingAssignedDomainEvent`:**
   * Payload: `Guid AssignmentId`, `Guid ParkingSpotId`, `string SpotNumber`, `string LicensePlate`, `DateTimeOffset EntryTime`.
   * Dispatch: Dispatched when an available spot is assigned to a visitor.
2. **`ParkingCheckoutDomainEvent`:**
   * Payload: `Guid AssignmentId`, `Guid ParkingSpotId`, `DateTimeOffset ExitTime`, `TimeSpan Duration`.
   * Dispatch: Dispatched when a visitor completes checkout and vacates the spot.
3. **`ParkingSpotStatusChangedDomainEvent`:**
   * Payload: `Guid ParkingSpotId`, `ParkingSpotStatus OldStatus`, `ParkingSpotStatus NewStatus`, `string Reason`.
   * Dispatch: Dispatched when spot is decommissioned or reinstated.

---

## 5. Invariant Enforcement & Business Rules

### Rule 1: Single Active Assignment
* A `ParkingSpot` can never have more than one concurrent active assignment.
* **Domain Check:** `ParkingSpot.AssignSpot()` validates `Status == ParkingSpotStatus.Available`.
* **Database Constraint:** Partial unique index:
  ```sql
  CREATE UNIQUE INDEX uq_parking_active_assignment 
  ON parking_assignments (parking_spot_id) 
  WHERE status = 1; -- 1: Active
  ```

### Rule 2: Out of Service Prohibition
* Any attempt to assign a spot with status `OutOfService` throws `DomainValidationException("ParkingSpotOutOfService")` immediately.

### Rule 3: Automatic Checkout Reversion
* Invoking `CompleteCheckout(exitTimeUtc)` on an active assignment:
  1. Sets `ExitTime = exitTimeUtc`.
  2. Transitions assignment status to `Completed` (2).
  3. Reverts associated `ParkingSpot.Status` to `Available` (1).

### Rule 4: License Plate Sanitization
* User inputs with hyphens ("ABC-123") or spacing (" ABC 123 ") are sanitized to canonical format ("ABC123").

### Rule 5: Temporal Validation
* `ExitTime >= EntryTime` is an absolute invariant enforced inside `CompleteCheckout`. If `ExitTime < EntryTime`, a `DomainValidationException("ExitTimeCannotPrecedeEntryTime")` is thrown.

### Rule 6: Multi-Layer Concurrency Control
* **Layer 1 (Optimistic Concurrency):** EF Core tracks `xmin` (PostgreSQL system row version). Concurrent modifications to `ParkingSpot` detect collisions and abort with `DbUpdateConcurrencyException`.
* **Layer 2 (Database Constraint):** The partial unique index guarantees that even if two transactions pass the optimistic check simultaneously, exactly one commits and the second fails with unique index violation (mapped to HTTP 409 Conflict).
