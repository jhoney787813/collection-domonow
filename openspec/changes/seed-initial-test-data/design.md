## Context

The DomoNow visitor parking platform requires realistic test records to demonstrate gatehouse operations (Angular) and analytics dashboards (Vue 3). See `proposal.md` for background and scope.

## Goals / Non-Goals

**Goals:**
- Provide realistic test data for 7 active vehicle sessions (bays `P-07`, `P-09`, `P-11`, `P-13`, `P-15`, `P-17`, `P-28`).
- Provide 2 out-of-service bays (`P-29`, `P-30`) for maintenance simulation.
- Provide 8 historical completed sessions with realistic durations (45 min to 2.5 hours) for analytics metrics.
- Ensure 100% compliance with domain invariants (plates `^[A-Z0-9]{5,8}$`, `ExitTime >= EntryTime`, and `uq_parking_active_assignment`).
- Dual-path initialization: SQL script for container startup and C# `DbInitializer` for API startup.

**Non-Goals:**
- Overwriting user data if existing active sessions are present.
- Modifying production database constraints.

## Decisions

### Decision 1: Dual-Path Seeding Strategy
- **SQL Initialization**: Embedded in `open-spec/06-database-ddl.sql` so any fresh container boot automatically executes the seed.
- **EF Core Runtime Seeder (`DbInitializer.cs`)**: Executed on API boot (`Program.cs`) only if `parking_assignments` is empty. This prevents duplicate insertion while ensuring existing running containers receive the test data.

### Decision 2: Invariant Compliance
- Each active assignment is assigned to a unique spot ID with status 2 (`Occupied`), avoiding violations of `uq_parking_active_assignment`.
- All plates are normalized uppercase alphanumeric.

## Risks / Trade-offs

- **[Risk]**: Volume persistence retaining old state if the container is not recreated with clean volume.
  → **Mitigation**: Execute the seed script directly on the running container and implement `DbInitializer` in .NET.
