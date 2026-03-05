import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE, Database } from '../../db/db.module';
import * as schema from '../../db/schema';
import { Employee } from '../../db/schema';
import { eq, gte, sum, max, asc } from 'drizzle-orm';

@Injectable()
export class EmployeesRepository {
  private readonly logger = new Logger(EmployeesRepository.name);
  constructor(@Inject(DRIZZLE) private db: Database) {}

  async findAll(): Promise<Employee[]> {
    try {
      return await this.db
        .select()
        .from(schema.employees)
        .orderBy(asc(schema.employees.externalId));
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error({
          stack: error.stack,
          message: 'findAllEmployeesFailed',
          error,
        });
      }
      throw error;
    }
  }

  async findByExternalId(externalId: string): Promise<Employee | undefined> {
    try {
      return await this.db.query.employees.findFirst({
        where: eq(schema.employees.externalId, externalId),
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error({
          stack: error.stack,
          message: 'findEmployeeByExternalIdFailed',
          details: { externalId },
          error,
        });
      }
      throw error;
    }
  }

  async upsert(employee: typeof schema.employees.$inferInsert) {
    try {
      const existing = await this.findByExternalId(employee.externalId);
      if (existing) {
        return await this.db
          .update(schema.employees)
          .set({ ...employee })
          .where(eq(schema.employees.externalId, employee.externalId))
          .returning();
      }

      return await this.db
        .insert(schema.employees)
        .values(employee)
        .returning();
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error({
          stack: error.stack,
          message: 'upsertEmployeeFailed',
          details: { externalId: employee.externalId },
          error,
        });
      }
      throw error;
    }
  }

  async getLastShiftEndDates() {
    try {
      return await this.db
        .select({
          employeeExternalId: schema.shifts.employeeExternalId,
          lastShiftEndAt: max(schema.shifts.endAt),
        })
        .from(schema.shifts)
        .groupBy(schema.shifts.employeeExternalId);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error({
          stack: error.stack,
          message: 'getLastShiftEndDatesFailed',
          error,
        });
      }
      throw error;
    }
  }

  async getRecentEarnings(days: number) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      return await this.db
        .select({
          employeeExternalId: schema.shifts.employeeExternalId,
          totalEarningsCents: sum(schema.shifts.earningsCents),
        })
        .from(schema.shifts)
        .where(gte(schema.shifts.startAt, startDate))
        .groupBy(schema.shifts.employeeExternalId);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error({
          stack: error.stack,
          message: 'getRecentEarningsFailed',
          details: { days },
          error,
        });
      }
      throw error;
    }
  }
}
