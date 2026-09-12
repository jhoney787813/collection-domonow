## 1. Test Data Implementation & Verification

- [x] 1.1 Update `open-spec/06-database-ddl.sql` with initial test data (7 active assignments, 8 historical completed sessions, 2 out-of-service bays) and verify syntax
- [x] 1.2 Implement `DbInitializer.cs` in `DomoNow.Parking.Infrastructure` and configure startup execution in `DomoNow.Parking.Api/Program.cs`
- [x] 1.3 Execute seed script against running PostgreSQL container `domonow-postgres-db` and verify table contents
- [x] 1.4 Verify endpoints `GET /api/parking-spots` and `GET /api/parking-assignments/active` and confirm test suite passes
