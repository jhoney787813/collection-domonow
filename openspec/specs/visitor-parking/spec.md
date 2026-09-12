# Visitor Parking Management Specification

## Purpose
The DomoNow Visitor Parking Management subsystem orchestrates physical spot allocation, visitor access logging, real-time occupancy monitoring, and automatic checkout reconciliation for residential complexes under high-concurrency conditions.

## Requirements

### Requirement: Spot Retrieval and Status Filtering
The system SHALL provide an API to query visitor parking spots with real-time status and active assignment details, supporting optional filtering by status (Available, Occupied, OutOfService).

#### Scenario: Retrieve all parking spots without filter
- **WHEN** a client requests parking spots with no status filter
- **THEN** the system returns HTTP 200 OK with a list of all configured parking spots (P-01 to P-30) including their current status and active assignment if occupied.

#### Scenario: Retrieve filtered spots by status
- **WHEN** a client requests parking spots specifying `statusFilter=Available`
- **THEN** the system returns HTTP 200 OK with only parking spots whose current status is Available.

### Requirement: Visitor Parking Entry Registration
The system SHALL register a new visitor entry by allocating a specified parking spot, recording visitor details, sanitizing the license plate, and updating the spot status to Occupied.

#### Scenario: Successful visitor entry registration
- **WHEN** a valid entry request is received for an Available spot with license plate "ABC-123", visitor name "Carlos Mendoza", and destination unit "Torre 2 - Apt 402"
- **THEN** the system normalizes the license plate to "ABC123", sets entry time in UTC, marks the spot as Occupied, creates an active assignment record, and returns HTTP 201 Created with the assignment details.

#### Scenario: Entry rejected due to spot already occupied
- **WHEN** an entry request targets a spot that currently has an active assignment (Occupied)
- **THEN** the system rejects the operation, prevents duplicate assignment via domain rule and database partial unique index, and returns HTTP 409 Conflict.

#### Scenario: Entry rejected due to spot out of service
- **WHEN** an entry request targets a spot whose status is OutOfService
- **THEN** the system raises a domain validation rule violation and returns HTTP 422 Unprocessable Entity.

#### Scenario: Entry rejected due to invalid license plate
- **WHEN** an entry request provides a license plate that cannot be normalized to valid alphanumeric format `^[A-Z0-9]{5,8}$`
- **THEN** the system rejects the command and returns HTTP 422 Unprocessable Entity with validation errors.

### Requirement: Parking Spot Checkout and Status Reversion
The system SHALL record the departure of a visitor, set exit time in UTC, mark the assignment as Completed, and automatically restore the corresponding parking spot status to Available.

#### Scenario: Successful checkout completion
- **WHEN** a checkout request is issued for an active assignment ID
- **THEN** the system records `exitTimeUtc`, verifies invariant `ExitTime >= EntryTime`, transitions assignment status to Completed, updates the associated ParkingSpot status to Available, and returns HTTP 200 OK with calculated duration.

#### Scenario: Checkout rejected due to temporal invariant violation
- **WHEN** checkout is attempted with an exit time chronologically preceding the recorded entry time
- **THEN** the system rejects the operation, preserving data consistency, and returns HTTP 400 Bad Request.

#### Scenario: Checkout rejected for non-existent assignment
- **WHEN** checkout is requested for an assignment ID that does not exist in the system
- **THEN** the system returns HTTP 404 Not Found.

### Requirement: Active Assignments Summary Query
The system SHALL expose an endpoint to retrieve all active visitor parking assignments to feed the operator dashboard and real-time alerts.

#### Scenario: Query active assignments list
- **WHEN** an operator requests the active assignments overview
- **THEN** the system returns HTTP 200 OK with an array of active assignments including spot numbers, license plates, visitor names, destination units, and elapsed occupancy time.

### Requirement: High-Concurrency Allocation Control
The system SHALL guarantee strict transactional consistency such that under simultaneous concurrent requests targeting the same parking spot, exactly one allocation succeeds and all others are rejected without state corruption.

#### Scenario: Ten simultaneous requests targeting spot P-15
- **WHEN** 10 concurrent asynchronous HTTP requests attempt to register an entry for spot "P-15" at the same instant
- **THEN** exactly 1 request succeeds with HTTP 201 Created, exactly 9 requests fail with HTTP 409 Conflict, and the database maintains exactly 1 active assignment row.
