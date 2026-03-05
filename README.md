# Level Integration Connector

A full-stack monorepo built for the Level Integration Connector. It features a Next.js web dashboard and a NestJS backend that ingests CSV workforce data into a Postgres database.

## Architecture

This project is structured as an npm workspace monorepo:
- `apps/backend`: NestJS API & background workers (Drizzle ORM + Postgres).
- `apps/web`: Next.js web application (Tailwind CSS + shadcn/ui).
- `packages/api-contract`: Shared Zod schemas and TypeScript interfaces ensuring 100% type safety between frontend and backend.
- `data/`: Sample CSV files to simulate the integration.

---

## 🚀 One-Command Run (Docker)

The project is fully dockerized. To start everything (Postgres, Mock API, Backend API, and Frontend web dashboard):

1. Ensure **Docker Desktop** is running.
2. Run the following command from the root of the project:

```bash
docker compose up --build
```

3. Open your browser to **http://localhost:3000** to view the dashboard.
   - *Backend API runs on port 4000.*
   - *Mock Provider runs on port 4001.*

## 🛠 Features Implemented
- **Idempotent Syncs**: Handles full-file UPSERTs safely without duplicating data.
- **Data Validation (Zod)**: Enforces email lowercasing, date sequencing (start < end), and mathematical validation (earnings math, strictly positive rates).
- **Dual Connectors**: Supports reading from both local CSV files (`/data`) and the Mock API Provider.
- **Idempotency Tracking**: Clear reporting in the UI showing exactly how many records were inserted vs. updated.

## 🧪 Testing

To run the backend unit tests (covers overlap detection, earnings math, and upserts):
```bash
cd apps/backend && npm run test
```

## 🏗 Developing Locally (Without Docker)

If you prefer to run the project without Docker:

```bash
# 1. Install dependencies from the root
npm install

# 2. Start PostgreSQL in the background
docker compose up db -d

# 3. Run database migrations
cd apps/backend && npm run migrate

# 4. Go back to the root and start the dev servers
cd ../../ 
npm run dev
```


## How it works

1. Open the UI at http://localhost:3000.
2. Click **Run Sync**. You can now choose between:
   - **Sync All Sources**: Triggers both File and API synchronizations.
   - **Sync from File**: Reads from local CSV files.
   - **Sync from Mock API**: Fetches from the internal Mock API.
3. Use the **Source Filter** (All / File / API) above the table to toggle data visibility without deleting records.
4. The NestJS backend:
   - Reads CSVs from `/data` (if source=file) OR fetches from `mock-api:4001` (if source=api).
   - Validates every record using Zod.
   - Performs idempotent UPSERTs via Drizzle ORM, tracking the `source` for each record.
5. The dashboard dynamically calculates **Last 7 Days Earnings** relative to UTC server time.

## Key Improvements & Edge Cases

The following enhancements have been implemented to improve system robustness and data integrity:

### 1. Enhanced Sync Reporting (Idempotency Tracking)
The sync process distinguishes between **new** records and **updates** to existing ones.
- **Edge Case**: Running the sync twice with the exact same data will show `N` updates and `0` insertions on the second run.
- **Benefit**: Users can clearly see if a sync brought in new data or just refreshed existing records.

### 2. Strict Overlap Detection
The overlap validation logic was hardened to prevent any temporal conflicts for an employee.
- **Logic**: Uses inclusive boundaries (`LTE`/`GTE`) to catch even shifts that "touch" at the exact same second.
- **Edge Cases Covered**: Partial overlaps, full enveloping (one shift inside another), and back-to-back boundary touching.
- **Reliability**: Protects against "Double Earning" errors where an employee might be paid twice for the same hour.
### 3. Comprehensive Data Validation
The ingest pipeline guarantees bad data will never corrupt the Postgres database by parsing and sanitizing every row through strict Zod schemas:
- **Nullable & Missing Emails**: Seamlessly handles missing emails, properly casting them as `null` to respect the database schema without throwing arbitrary errors.
- **Positive Number Constraints**: Actively tests mathematical bounds, automatically rejecting rows with zero or negative hourly rates.
- **Strict ISO 8601 Timestamps**: Rejects loosely formatted, invalid strings to guarantee uniform UTC `start_at` and `end_at` persistence.
- **Ghost Reference Protection**: Performs relational safety checks; if a shift references an `employee_external_id` that does not exist in the database, the shift is logged as an error and skipped.

*Note: You will see intentional "bad data" rows within the `data/*.csv` files that demonstrate these error-handling mechanisms without halting the overall sync!*


## 🧪 Testing

We use **Jest** for unit testing the core business logic.

**Run Backend Tests:**
```bash
cd apps/backend && npm run test
```

**What is covered:**
- `SyncService`: Verifies upsert logic, duration calculations, and earnings math.  Verifies overlap detection logic and boundary conditions.

---

## Assumptions & Tradeoffs

- **Flexible Email Identity**: We assume that `external_id` is the primary anchor of identity. If two different IDs use the same email, we treat them as separate records (e.g., separate contracts) but flag the collision for review.
- **Idempotent Updates**: Re-running a sync with the same `external_id` will update existing records, ensuring the system can be recovered from any state without duplication.
- **Timezone**: All times are stored in **UTC**. The dashboard uses server-side aggregation to calculate earnings relative to current UTC time.
- **Partial Success**: The system prioritizes "syncing what we can" over "failing fast," which is ideal for large datasets with occasional manual entry errors.

## What's Next?

- **Error resolution**: Adding a way to resolve errors in the UI.
