import { Injectable, Logger } from '@nestjs/common';
import { EmployeesRepository } from './employees.repository';
import { ShiftsRepository } from '../sync/repositories/shifts.repository';
import { Employee, Shift } from '@/db/schema';
import type {
  EmployeeWithSummary,
  EmployeeShiftsResponse,
  SyncSource,
} from '@level/api-contract';
import { DAYS_FOR_EARNINGS } from './constants/constants';
import {
  GetShiftsQuerySchema,
  GetShiftsQuery,
} from './models/employees.schema';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly shiftsRepository: ShiftsRepository,
  ) { }

  async getEmployees(
    days: number = DAYS_FOR_EARNINGS,
  ): Promise<EmployeeWithSummary[]> {
    try {
      const allEmployees = await this.employeesRepository.findAll();

      const lastShiftResults =
        await this.employeesRepository.getLastShiftEndDates();

      const earningsResults =
        await this.employeesRepository.getRecentEarnings(days);

      const lastShiftMap = new Map<string, string>();
      for (const result of lastShiftResults) {
        if (result.lastShiftEndAt) {
          lastShiftMap.set(
            result.employeeExternalId,
            result.lastShiftEndAt.toISOString(),
          );
        }
      }

      const earningsMap = new Map<string, number>(
        earningsResults.map((result) => [
          result.employeeExternalId,
          Number(result.totalEarningsCents),
        ]),
      );

      return allEmployees.map((employee: Employee) => {
        const lastShiftEndAt = lastShiftMap.get(employee.externalId);
        return {
          externalId: employee.externalId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          active: employee.active,
          hourlyRateCents: employee.hourlyRateCents,
          lastShiftEndAt: lastShiftEndAt
            ? new Date(lastShiftEndAt).toISOString()
            : null,
          totalEarningsCentsLast7Days:
            earningsMap.get(employee.externalId) ?? 0,
          source: employee.source as SyncSource,
        };
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error({
          stack: error.stack,
          message: 'getEmployeesFailed',
          error,
        });
      }
      throw error;
    }
  }

  async getShiftsForEmployee(
    externalId: string,
    query: GetShiftsQuery,
  ): Promise<EmployeeShiftsResponse | null> {
    const validatedQuery = GetShiftsQuerySchema.safeParse(query);

    if (!validatedQuery.success) {
      throw new HttpException(
        {
          message: 'Validation failed',
          errors: validatedQuery.error.format(),
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const { from, to } = validatedQuery.data;
    try {
      this.logger.log(
        `Fetching shifts for ${externalId}: from=${from}, to=${to}`,
      );

      const employee =
        await this.employeesRepository.findByExternalId(externalId);

      if (!employee) {
        return null;
      }

      const fromDate = from ? new Date(from) : undefined;
      const toDate = to ? new Date(to) : undefined;

      const shifts = await this.shiftsRepository.findByEmployeeIdAndDateRange(
        externalId,
        fromDate,
        toDate,
      );

      const totalWorkMinutes = shifts.reduce(
        (sum, shift: Shift) => sum + (shift.workMinutes ?? 0),
        0,
      );
      const totalEarningsCents = shifts.reduce(
        (sum, shift: Shift) => sum + (shift.earningsCents ?? 0),
        0,
      );

      return {
        employee: {
          externalId: employee.externalId,
          firstName: employee.firstName,
          lastName: employee.lastName,
        },
        shifts: shifts.map((shift: Shift) => ({
          ...shift,
          source: shift.source as SyncSource,
          startAt: shift.startAt.toISOString(),
          endAt: shift.endAt.toISOString(),
        })),
        totals: {
          shiftCount: shifts.length,
          totalWorkMinutes,
          totalEarningsCents,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error({
          stack: error.stack,
          message: 'getShiftsForEmployeeFailed',
          details: { externalId, from, to },
          error,
        });
      }
      throw error;
    }
  }
}
