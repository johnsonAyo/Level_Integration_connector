import { Injectable, Logger } from '@nestjs/common';
import { EmployeesRepository } from '../employees/employees.repository';
import { ShiftsRepository } from './repositories/shifts.repository';
import { SyncRunsRepository } from './repositories/sync-runs.repository';
import { EmployeeCsvSchema, ShiftCsvSchema } from './models/sync.schema';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import { SyncRunStatus } from './models/sync.interfaces';

import { SYNC_CONSTANTS } from './constants/sync.constants';
import {
  SyncStats,
  RawEmployee,
  RawShift,
  SyncSource,
} from './models/sync.interfaces';
import { formatZodError } from './utils/error.utils';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly shiftsRepository: ShiftsRepository,
    private readonly syncRunsRepository: SyncRunsRepository,
  ) { }
  private get isProd(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  async runFileSync() {
    return this.executeSync(SyncSource.File, async (stats) => {
      stats.source = SyncSource.File;

      const dataDir = this.isProd
        ? SYNC_CONSTANTS.DATA_DIR_PROD
        : path.join(process.cwd(), SYNC_CONSTANTS.DATA_DIR_DEV);

      const empPath = path.join(dataDir, 'employees.csv');
      const shiftPath = path.join(dataDir, 'shifts.csv');

      if (!fs.existsSync(empPath)) {
        throw new Error(`Employee CSV file not found at ${empPath}`);
      }

      if (!fs.existsSync(shiftPath)) {
        throw new Error(`Shift CSV file not found at ${shiftPath}`);
      }

      const empRows: RawEmployee[] = parse(fs.readFileSync(empPath, 'utf-8'), {
        columns: true,
        skip_empty_lines: true,
      });

      await this.syncEmployees(stats, empRows);

      const shiftRows: RawShift[] = parse(fs.readFileSync(shiftPath, 'utf-8'), {
        columns: true,
        skip_empty_lines: true,
      });

      await this.syncShifts(stats, shiftRows);
    });
  }

  async runApiSync() {
    return this.executeSync(SyncSource.API, async (stats) => {
      stats.source = SyncSource.API;
      const apiUrl = process.env.MOCK_API_URL || SYNC_CONSTANTS.DEFAULT_MOCK_API_URL;

      // Fetch employees
      const empsRes = await fetch(`${apiUrl}/employees`);
      if (!empsRes.ok)
        throw new Error(`API returned ${empsRes.status} for employees`);
      const empRows: RawEmployee[] = (await empsRes.json()) as RawEmployee[];
      await this.syncEmployees(stats, empRows);

      // Fetch shifts
      const shiftsRes = await fetch(`${apiUrl}/shifts`);
      if (!shiftsRes.ok)
        throw new Error(`API returned ${shiftsRes.status} for shifts`);
      const shiftRows: RawShift[] = (await shiftsRes.json()) as RawShift[];
      await this.syncShifts(stats, shiftRows);
    });
  }

  private async executeSync(
    source: SyncSource,
    performSync: (stats: SyncStats) => Promise<void>,
  ) {
    const run = await this.syncRunsRepository.create({
      source,
      status: SyncRunStatus.Processing,
      startedAt: new Date(),
    });

    const stats: SyncStats = {
      read: 0,
      inserted: 0,
      updated: 0,
      errored: 0,
      issues: [],
      source,
    };

    try {
      await performSync(stats);

      const finalStatus =
        stats.errored > 0 && stats.inserted === 0 && stats.updated === 0
          ? SyncRunStatus.Error
          : SyncRunStatus.Success;

      return await this.syncRunsRepository.update(run.id, {
        status: finalStatus,
        finishedAt: new Date(),
        recordsRead: stats.read,
        recordsInserted: stats.inserted,
        recordsUpdated: stats.updated,
        recordsErrored: stats.errored,
        errors: stats.issues.length > 0 ? stats.issues : null,
      });
    } catch (globalErr: unknown) {
      const message =
        globalErr instanceof Error ? globalErr.message : String(globalErr);
      if (globalErr instanceof Error) {
        this.logger.error({
          stack: globalErr.stack,
          message: 'syncRunFailed',
          details: { runId: run.id, source: stats.source },
          error: globalErr,
        });
      }

      return await this.syncRunsRepository.update(run.id, {
        status: SyncRunStatus.Error,
        finishedAt: new Date(),
        recordsRead: stats.read,
        recordsInserted: stats.inserted,
        recordsUpdated: stats.updated,
        recordsErrored: stats.errored,
        errors: [message, ...stats.issues],
      });
    }
  }

  private async syncEmployees(stats: SyncStats, employeeRows: RawEmployee[]) {
    for (const employeeRow of employeeRows) {
      stats.read++;
      try {
        const validated = EmployeeCsvSchema.parse(employeeRow);
        const hourlyRateCents = Math.round(
          validated.hourly_rate * SYNC_CONSTANTS.CENTS_PER_UNIT,
        );

        const existingEmployee =
          await this.employeesRepository.findByExternalId(
            validated.external_id,
          );

        await this.employeesRepository.upsert({
          externalId: validated.external_id,
          firstName: validated.first_name,
          lastName: validated.last_name,
          email: validated.email,
          hourlyRateCents,
          active: validated.active,
          source: stats.source,
        });

        if (existingEmployee) {
          stats.updated++;
        } else {
          stats.inserted++;
        }
      } catch (err) {
        const message = formatZodError(err);
        stats.errored++;
        stats.issues.push(
          `Employee ${employeeRow.external_id || '(unknown)'}: ${message}`,
        );
        if (err instanceof Error) {
          this.logger.error({
            stack: err.stack,
            message: 'syncEmployeeRowFailed',
            details: { externalId: employeeRow.external_id },
            error: err,
          });
        }
      }
    }
  }

  private async syncShifts(stats: SyncStats, shiftRows: RawShift[]) {
    for (const shiftRow of shiftRows) {
      stats.read++;
      try {
        const validatedResponse = ShiftCsvSchema.safeParse(shiftRow);

        if (!validatedResponse.success) {
          const message = formatZodError(validatedResponse.error);
          stats.issues.push(
            `Shift ${shiftRow.external_id || '(unknown)'}: ${message}`,
          );
          stats.errored++;
          continue;
        }

        const validated = validatedResponse.data;
        const validationError = await this.validateShiftRow(validated);

        if (validationError) {
          stats.issues.push(validationError);
          stats.errored++;
          continue;
        }

        const employee = await this.employeesRepository.findByExternalId(
          validated.employee_external_id,
        );

        const { workMinutes, earningsCents } = this.calculateShiftEarnings(
          new Date(validated.start_at),
          new Date(validated.end_at),
          validated.break_minutes || 0,
          employee!.hourlyRateCents,
        );

        const existingShift = await this.shiftsRepository.findByExternalId(
          validated.external_id,
        );

        await this.shiftsRepository.upsert({
          externalId: validated.external_id,
          employeeExternalId: validated.employee_external_id,
          startAt: new Date(validated.start_at),
          endAt: new Date(validated.end_at),
          breakMinutes: validated.break_minutes || 0,
          workMinutes,
          earningsCents,
          source: stats.source,
        });

        if (existingShift) {
          stats.updated++;
        } else {
          stats.inserted++;
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : formatZodError(err);
        stats.errored++;
        stats.issues.push(
          `Shift ${shiftRow.external_id}: ${message}`,
        );
        if (err instanceof Error) {
          this.logger.error({
            stack: err.stack,
            message: 'syncShiftRowFailed',
            details: { externalId: shiftRow.external_id },
            error: err,
          });
        }
      }
    }
  }

  private async validateShiftRow(
    validated: { external_id: string; employee_external_id: string; start_at: string; end_at: string },
  ): Promise<string | null> {
    const employee = await this.employeesRepository.findByExternalId(
      validated.employee_external_id,
    );
    if (!employee) {
      return `Shift row ${validated.external_id}: Referenced employee ${validated.employee_external_id} not found`;
    }

    const startDate = new Date(validated.start_at);
    const endDate = new Date(validated.end_at);

    if (endDate <= startDate) {
      return `Shift row ${validated.external_id}: End date (${endDate.toLocaleString()}) must be after start date (${startDate.toLocaleString()})`;
    }

    const overlapping = await this.shiftsRepository.findOverlappingShift(
      validated.employee_external_id,
      startDate,
      endDate,
      validated.external_id,
    );

    if (overlapping) {
      return `Shift row ${validated.external_id}: Overlaps with existing shift ${overlapping.externalId}`;
    }

    return null;
  }

  private calculateShiftEarnings(
    startDate: Date,
    endDate: Date,
    breakMinutes: number,
    hourlyRateCents: number,
  ): { workMinutes: number; earningsCents: number } {
    const totalDurationMinutes = Math.floor(
      (endDate.getTime() - startDate.getTime()) /
      SYNC_CONSTANTS.MS_PER_MINUTE,
    );
    const workMinutes = Math.max(0, totalDurationMinutes - breakMinutes);
    const earningsCents = Math.round(
      (workMinutes / SYNC_CONSTANTS.MINUTES_PER_HOUR) * hourlyRateCents,
    );

    return { workMinutes, earningsCents };
  }

  async getSyncRuns() {
    return this.syncRunsRepository.findAllOrdered();
  }
}
