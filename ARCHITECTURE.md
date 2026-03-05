# Architecture Overview

This document outlines the high-level architecture of the Level Integration Connector.

## System Components

### Backend (NestJS)

The backend is built with NestJS, a progressive Node.js framework. It follows a modular structure:

- **Modules**: Grouped by functionality (e.g., `Employees`, `Sync`).
- **Controllers**: Handle HTTP requests and routing.
- **Services**: Contain business logic and orchestrate domain operations.
- **Repositories**: Abstract database interactions using Drizzle ORM.
- **Models**: Define data schemas (Zod) and interfaces for validation and type safety.

### Database (PostgreSQL)

The application uses PostgreSQL as its primary data store.

- **Schema**: Managed via Drizzle ORM (`db/schema.ts`).
- **Tables**:
  - `employees`: Stores employee profile data (external ID, name, email, hourly rate).
  - `shifts`: Stores shift records (external ID, employee reference, start/end times, derived work minutes, and earnings).
  - `sync_runs`: Audits each synchronization event, tracking successes, failures, and metadata.

## Core Workflows

### 1. Data Synchronization (`SyncService`)

The sync process is designed for **Reliability** and **Idempotency**:

1.  **Ingestion**: Receives data from two sources:
    - **CSV File**: Parsed using `csv-parse`.
    - **Mock API**: Fetched via HTTP requests.
2.  **Validation**:
    - **Schema Check**: Each row is validated against a Zod schema (e.g., `EmployeeCsvSchema`).
    - **Business Rules**:
      - **Email Collision**: Detects if an email is shared across different `externalId`s (logged as a potential duplicate).
      - **Shift Duration**: Rejects shifts longer than 14 hours.
      - **Overlapping Shifts**: Detects if an employee has conflicting shifts.
3.  **Transformation**:
    - Calculates `workMinutes` (Total - Break).
    - Calculates `earningsCents` based on the employee's `hourlyRate`.
4.  **Upsert**: Uses the `externalId` to intelligently insert new records or update existing ones, ensuring the sync is repeatable without creating duplicates.
5.  **Audit**: A `SyncRun` record is created to provide a detailed summary of the operation (records read, inserted, updated, and skipped).

### 2. Employee Insights (`EmployeesService`)

Provides a REST API to query employee data and their recent shift history:

- **Aggregation**: Summarizes shift data (total earnings, last shift) during retrieval.
- **Filtering**: Supports date-range filtering for shift queries with robust validation.

## Design Principles

- **Separation of Concerns**: Data access, business logic, and transport layers are decoupled.
- **Fail-Soft Strategy**: Partial failures in the sync process (e.g., one bad shift row) are captured in the audit log without aborting the entire run.
- **Type Safety**: End-to-end type safety using TypeScript and Zod.
