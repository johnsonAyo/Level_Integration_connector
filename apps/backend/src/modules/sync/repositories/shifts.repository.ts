import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE, Database } from '../../../db/db.module';
import * as schema from '../../../db/schema';
import { Shift } from '../../../db/schema';
import { eq, and, gte, lte, ne } from 'drizzle-orm';

@Injectable()
export class ShiftsRepository {
  private readonly logger = new Logger(ShiftsRepository.name);
  constructor(@Inject(DRIZZLE) private db: Database) {}

  async findByExternalId(externalId: string): Promise<Shift | undefined> {
    try {
      return await this.db.query.shifts.findFirst({
        where: eq(schema.shifts.externalId, externalId),
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error({
          stack: error.stack,
          message: 'findShiftByExternalIdFailed',
          details: { externalId },
          error,
        });
      }
      throw error;
    }
  }

  async findOverlappingShift(
    employeeExternalId: string,
    start: Date,
    end: Date,
    excludeShiftExternalId?: string,
  ): Promise<Shift | undefined> {
    try {
      const conditions = [
        eq(schema.shifts.employeeExternalId, employeeExternalId),
        // (ExistingStart <= NewEnd) AND (ExistingEnd >= NewStart)
        lte(schema.shifts.startAt, end),
        gte(schema.shifts.endAt, start),
      ];

      if (excludeShiftExternalId) {
        conditions.push(ne(schema.shifts.externalId, excludeShiftExternalId));
      }

      return await this.db.query.shifts.findFirst({
        where: and(...conditions),
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error({
          stack: error.stack,
          message: 'findOverlappingShiftFailed',
          details: { employeeExternalId, start, end, excludeShiftExternalId },
          error,
        });
      }
      throw error;
    }
  }

  async findByEmployeeIdAndDateRange(
    employeeExternalId: string,
    from?: Date,
    to?: Date,
  ): Promise<Shift[]> {
    try {
      const conditions = [
        eq(schema.shifts.employeeExternalId, employeeExternalId),
      ];

      if (from) {
        conditions.push(gte(schema.shifts.startAt, from));
      }
      if (to) {
        conditions.push(lte(schema.shifts.endAt, to));
      }

      return await this.db
        .select()
        .from(schema.shifts)
        .where(and(...conditions));
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error({
          stack: error.stack,
          message: 'findByEmployeeIdAndDateRangeFailed',
          details: { employeeExternalId, from, to },
          error,
        });
      }
      throw error;
    }
  }

  async upsert(shift: typeof schema.shifts.$inferInsert) {
    try {
      const existing = await this.findByExternalId(shift.externalId);
      if (existing) {
        return await this.db
          .update(schema.shifts)
          .set({ ...shift })
          .where(eq(schema.shifts.externalId, shift.externalId))
          .returning();
      }
      return await this.db.insert(schema.shifts).values(shift).returning();
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error({
          stack: error.stack,
          message: 'upsertShiftFailed',
          details: { externalId: shift.externalId },
          error,
        });
      }
      throw error;
    }
  }
}
