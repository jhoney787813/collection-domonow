-- =============================================================================
-- DOMONOW PROPTECH PLATFORM - VISITOR PARKING MANAGEMENT
-- Open Spec 06: PostgreSQL 17 Alpine DDL & Schema Definitions
-- Compliance: Acid Isolation, Advisory Locks, Partial Unique Concurrency Guard
-- =============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean Existing Schema (Idempotent execution)
DROP TABLE IF EXISTS parking_assignments CASCADE;
DROP TABLE IF EXISTS parking_spots CASCADE;

-- 3. Table: parking_spots
-- Represents physical visitor bays within the residential property.
-- Optimistic concurrency is supported natively via PostgreSQL system column `xmin`.
CREATE TABLE parking_spots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spot_number VARCHAR(20) NOT NULL,
    status SMALLINT NOT NULL DEFAULT 1, -- 1: Available, 2: Occupied, 3: OutOfService
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_parking_spot_number UNIQUE (spot_number),
    CONSTRAINT chk_parking_spot_status CHECK (status IN (1, 2, 3))
);

COMMENT ON TABLE parking_spots IS 'Physical parking bays in the residential complex.';
COMMENT ON COLUMN parking_spots.status IS 'Operational status: 1 = Available, 2 = Occupied, 3 = OutOfService.';

-- 4. Table: parking_assignments
-- Records visitor occupancy sessions, driver details, and departure reconciliation.
CREATE TABLE parking_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parking_spot_id UUID NOT NULL,
    license_plate VARCHAR(10) NOT NULL,
    visitor_name VARCHAR(100) NOT NULL,
    destination_unit VARCHAR(100) NOT NULL,
    entry_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    exit_time TIMESTAMPTZ NULL,
    status SMALLINT NOT NULL DEFAULT 1, -- 1: Active, 2: Completed, 3: Cancelled
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_parking_assignment_spot FOREIGN KEY (parking_spot_id)
        REFERENCES parking_spots (id) ON DELETE RESTRICT,
    CONSTRAINT chk_assignment_status CHECK (status IN (1, 2, 3)),
    CONSTRAINT chk_assignment_temporal CHECK (exit_time IS NULL OR exit_time >= entry_time),
    CONSTRAINT chk_assignment_license_plate CHECK (license_plate ~ '^[A-Z0-9]{5,8}$')
);

COMMENT ON TABLE parking_assignments IS 'Visitor vehicle parking sessions and access records.';
COMMENT ON COLUMN parking_assignments.status IS 'Assignment lifecycle state: 1 = Active, 2 = Completed, 3 = Cancelled.';

-- 5. CRITICAL INVARIANT: Partial Unique Index
-- Guarantees mathematically that no parking spot can ever have more than ONE active assignment at any point in time.
-- Under high-concurrency races, PostgreSQL enforces uniqueness here, returning error code 23505.
CREATE UNIQUE INDEX uq_parking_active_assignment 
ON parking_assignments (parking_spot_id) 
WHERE status = 1;

-- 6. Operational Performance Indexes
CREATE INDEX idx_parking_assignments_status ON parking_assignments (status);
CREATE INDEX idx_parking_assignments_entry_time ON parking_assignments (entry_time);
CREATE INDEX idx_parking_assignments_plate ON parking_assignments (license_plate);
CREATE INDEX idx_parking_spots_status ON parking_spots (status);

-- 7. Seed Data: Initialize 30 Parking Bays (P-01 to P-30)
INSERT INTO parking_spots (id, spot_number, status, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    'P-' || LPAD(s::text, 2, '0'),
    1, -- Available
    NOW(),
    NOW()
FROM generate_series(1, 30) AS s;
