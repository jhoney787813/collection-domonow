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

-- 8. Seed Initial Test Data: Active & Historical Visitor Sessions
-- 8.1 Mark maintenance spots as OutOfService (status = 3)
UPDATE parking_spots SET status = 3, updated_at = NOW() WHERE spot_number IN ('P-29', 'P-30');

-- 8.2 Seed Active Visitor Sessions (status = 1 in parking_assignments, status = 2 Occupied in parking_spots)
DO $$
DECLARE
    s_id UUID;
BEGIN
    -- Spot P-07: Ana María López
    SELECT id INTO s_id FROM parking_spots WHERE spot_number = 'P-07';
    UPDATE parking_spots SET status = 2, updated_at = NOW() WHERE id = s_id;
    INSERT INTO parking_assignments (id, parking_spot_id, license_plate, visitor_name, destination_unit, entry_time, exit_time, status, created_at, updated_at)
    VALUES (uuid_generate_v4(), s_id, 'DMO101', 'Ana María López', 'Torre 1 - Apt 402', NOW() - INTERVAL '45 minutes', NULL, 1, NOW() - INTERVAL '45 minutes', NOW());

    -- Spot P-09: Carlos Andrés Pérez
    SELECT id INTO s_id FROM parking_spots WHERE spot_number = 'P-09';
    UPDATE parking_spots SET status = 2, updated_at = NOW() WHERE id = s_id;
    INSERT INTO parking_assignments (id, parking_spot_id, license_plate, visitor_name, destination_unit, entry_time, exit_time, status, created_at, updated_at)
    VALUES (uuid_generate_v4(), s_id, 'COL823', 'Carlos Andrés Pérez', 'Torre 2 - Apt 1004', NOW() - INTERVAL '2 hours', NULL, 1, NOW() - INTERVAL '2 hours', NOW());

    -- Spot P-11: Valentina Gómez
    SELECT id INTO s_id FROM parking_spots WHERE spot_number = 'P-11';
    UPDATE parking_spots SET status = 2, updated_at = NOW() WHERE id = s_id;
    INSERT INTO parking_assignments (id, parking_spot_id, license_plate, visitor_name, destination_unit, entry_time, exit_time, status, created_at, updated_at)
    VALUES (uuid_generate_v4(), s_id, 'VAL777', 'Valentina Gómez', 'Torre 3 - Apt 201', NOW() - INTERVAL '18 minutes', NULL, 1, NOW() - INTERVAL '18 minutes', NOW());

    -- Spot P-13: Fernando Morales
    SELECT id INTO s_id FROM parking_spots WHERE spot_number = 'P-13';
    UPDATE parking_spots SET status = 2, updated_at = NOW() WHERE id = s_id;
    INSERT INTO parking_assignments (id, parking_spot_id, license_plate, visitor_name, destination_unit, entry_time, exit_time, status, created_at, updated_at)
    VALUES (uuid_generate_v4(), s_id, 'BOG456', 'Fernando Morales', 'Torre 1 - Apt 805', NOW() - INTERVAL '3 hours 15 minutes', NULL, 1, NOW() - INTERVAL '3 hours 15 minutes', NOW());

    -- Spot P-15: Mariana Restrepo
    SELECT id INTO s_id FROM parking_spots WHERE spot_number = 'P-15';
    UPDATE parking_spots SET status = 2, updated_at = NOW() WHERE id = s_id;
    INSERT INTO parking_assignments (id, parking_spot_id, license_plate, visitor_name, destination_unit, entry_time, exit_time, status, created_at, updated_at)
    VALUES (uuid_generate_v4(), s_id, 'MED902', 'Mariana Restrepo', 'Torre 2 - Apt 503', NOW() - INTERVAL '1 hour 10 minutes', NULL, 1, NOW() - INTERVAL '1 hour 10 minutes', NOW());

    -- Spot P-17: Santiago Castro
    SELECT id INTO s_id FROM parking_spots WHERE spot_number = 'P-17';
    UPDATE parking_spots SET status = 2, updated_at = NOW() WHERE id = s_id;
    INSERT INTO parking_assignments (id, parking_spot_id, license_plate, visitor_name, destination_unit, entry_time, exit_time, status, created_at, updated_at)
    VALUES (uuid_generate_v4(), s_id, 'CRA314', 'Santiago Castro', 'Torre 4 - Apt 1102', NOW() - INTERVAL '35 minutes', NULL, 1, NOW() - INTERVAL '35 minutes', NOW());

    -- Spot P-28: Julián David Herrera
    SELECT id INTO s_id FROM parking_spots WHERE spot_number = 'P-28';
    UPDATE parking_spots SET status = 2, updated_at = NOW() WHERE id = s_id;
    INSERT INTO parking_assignments (id, parking_spot_id, license_plate, visitor_name, destination_unit, entry_time, exit_time, status, created_at, updated_at)
    VALUES (uuid_generate_v4(), s_id, 'DOM2026', 'Julián David Herrera', 'Torre 1 - Apt 304', NOW() - INTERVAL '50 minutes', NULL, 1, NOW() - INTERVAL '50 minutes', NOW());
END $$;

-- 8.3 Seed Historical Completed Assignments (for Analytics & Metrics)
DO $$
DECLARE
    s_p01 UUID;
    s_p02 UUID;
    s_p04 UUID;
    s_p05 UUID;
    s_p08 UUID;
    s_p10 UUID;
    s_p12 UUID;
    s_p14 UUID;
BEGIN
    SELECT id INTO s_p01 FROM parking_spots WHERE spot_number = 'P-01';
    SELECT id INTO s_p02 FROM parking_spots WHERE spot_number = 'P-02';
    SELECT id INTO s_p04 FROM parking_spots WHERE spot_number = 'P-04';
    SELECT id INTO s_p05 FROM parking_spots WHERE spot_number = 'P-05';
    SELECT id INTO s_p08 FROM parking_spots WHERE spot_number = 'P-08';
    SELECT id INTO s_p10 FROM parking_spots WHERE spot_number = 'P-10';
    SELECT id INTO s_p12 FROM parking_spots WHERE spot_number = 'P-12';
    SELECT id INTO s_p14 FROM parking_spots WHERE spot_number = 'P-14';

    INSERT INTO parking_assignments (id, parking_spot_id, license_plate, visitor_name, destination_unit, entry_time, exit_time, status, created_at, updated_at) VALUES
    (uuid_generate_v4(), s_p01, 'KLR890', 'Pedro Nel Ospina', 'Torre 1 - Apt 201', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '4 hours 30 minutes', 2, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '4 hours 30 minutes'),
    (uuid_generate_v4(), s_p02, 'MNB234', 'Claudia Marcela Rios', 'Torre 3 - Apt 602', NOW() - INTERVAL '7 hours', NOW() - INTERVAL '5 hours', 2, NOW() - INTERVAL '7 hours', NOW() - INTERVAL '5 hours'),
    (uuid_generate_v4(), s_p04, 'QWE567', 'Gustavo Adolfo Buitrago', 'Torre 2 - Apt 801', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '6 hours 15 minutes', 2, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '6 hours 15 minutes'),
    (uuid_generate_v4(), s_p05, 'TYU901', 'Andrea Catalina Ruiz', 'Torre 4 - Apt 305', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 hours 45 minutes', 2, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 hours 45 minutes'),
    (uuid_generate_v4(), s_p08, 'OPL345', 'Juan Camilo Vargas', 'Torre 1 - Apt 1101', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '2 hours 10 minutes', 2, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '2 hours 10 minutes'),
    (uuid_generate_v4(), s_p10, 'ZXC678', 'Diana Patricia Muñoz', 'Torre 3 - Apt 404', NOW() - INTERVAL '9 hours', NOW() - INTERVAL '7 hours 20 minutes', 2, NOW() - INTERVAL '9 hours', NOW() - INTERVAL '7 hours 20 minutes'),
    (uuid_generate_v4(), s_p12, 'ASD123', 'Esteban Duque Jaramillo', 'Torre 2 - Apt 903', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour 15 minutes', 2, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour 15 minutes'),
    (uuid_generate_v4(), s_p14, 'GHJ789', 'Laura Sofia Cárdenas', 'Torre 4 - Apt 502', NOW() - INTERVAL '5 hours 30 minutes', NOW() - INTERVAL '3 hours', 2, NOW() - INTERVAL '5 hours 30 minutes', NOW() - INTERVAL '3 hours');
END $$;
