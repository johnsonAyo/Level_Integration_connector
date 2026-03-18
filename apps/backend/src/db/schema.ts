import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { InferSelectModel } from 'drizzle-orm';

export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').unique().notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  hourlyRateCents: integer('hourly_rate_cents').notNull(),
  active: boolean('active').default(true),
  source: text('source').notNull(),
});

export type Employee = InferSelectModel<typeof employees>;

export const shifts = pgTable('shifts', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').unique().notNull(),
  employeeExternalId: text('employee_external_id')
    .notNull()
    .references(() => employees.externalId),
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  breakMinutes: integer('break_minutes').default(0),
  workMinutes: integer('work_minutes').notNull(),
  earningsCents: integer('earnings_cents').notNull(),
  source: text('source').notNull(),
});

export type Shift = InferSelectModel<typeof shifts>;

export const syncRuns = pgTable('sync_runs', {
  id: serial('id').primaryKey(),
  startedAt: timestamp('started_at').defaultNow(),
  finishedAt: timestamp('finished_at'),
  status: text('status'),
  source: text('source').notNull(),
  recordsRead: integer('records_read').default(0),
  recordsInserted: integer('records_inserted').default(0),
  recordsUpdated: integer('records_updated').default(0),
  recordsErrored: integer('records_errored').default(0),
  errors: jsonb('errors'),
});
