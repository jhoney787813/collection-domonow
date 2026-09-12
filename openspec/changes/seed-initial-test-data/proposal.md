## Why

When building and starting the DomoNow platform images (PostgreSQL 17 and .NET 10 API), the system needs realistic initial test records (active parking assignments, completed historical sessions, and out-of-service spots) so that both the Angular Operations MFE and the Vue Analytics MFE immediately present meaningful data, occupancy indicators, and historical metrics without requiring manual data entry.

## What Changes

- **Database DDL & Initialization Script (`open-spec/06-database-ddl.sql`)**: Enhanced with realistic test records executed automatically on PostgreSQL container first boot:
  - 7 active visitor parking assignments on spots `P-07`, `P-09`, `P-11`, `P-13`, `P-15`, `P-17`, and `P-28` (marking them `Occupied = 2`).
  - 2 spots marked `OutOfService = 3` (`P-29` and `P-30`) for maintenance simulation.
  - 8 completed historical sessions on spots `P-01`, `P-02`, `P-04`, `P-05`, `P-08`, `P-10`, `P-12`, `P-14` with valid temporal ordering (`exit_time > entry_time`).
  - 21 remaining spots in state `Available = 1`.
- **Application Startup Seeder (`DomoNow.Parking.Infrastructure/Data/DbInitializer.cs`)**: Idempotent seeding logic executed during application startup in `Program.cs` if the database has zero assignments, guaranteeing test data availability in all deployment modes.
- **Immediate Data Injection**: Direct execution against the active PostgreSQL 17 container in Podman.

## Capabilities

### New Capabilities
<!-- None: Testing and seed data tooling -->

### Modified Capabilities
<!-- None: Specification requirements remain unchanged -->

## Impact

- **Database**: PostgreSQL 17 container populates with 30 spots, 7 active sessions, and 8 historical sessions.
- **Frontend**: Immediate visual rendering of occupied bays in Angular and charts/KPIs in Vue.
- **API**: `GET /api/parking-spots` and `GET /api/parking-assignments/active` return realistic test data immediately after deployment.
