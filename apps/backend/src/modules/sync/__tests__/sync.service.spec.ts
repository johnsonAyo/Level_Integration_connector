import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from '../sync.service';
import { EmployeesRepository } from '../../employees/employees.repository';
import { ShiftsRepository } from '../repositories/shifts.repository';
import { SyncRunsRepository } from '../repositories/sync-runs.repository';
import { Employee, Shift } from '../../../db/schema';
import { DRIZZLE } from '../../../db/db.module';
import { SyncSource } from '../models/sync.interfaces';

describe('SyncService', () => {
  let service: SyncService;
  let employeesRepo: jest.Mocked<EmployeesRepository>;
  let shiftsRepo: jest.Mocked<ShiftsRepository>;

  beforeEach(async () => {
    const mockEmployeesRepo = {
      findByExternalId: jest.fn(),
      upsert: jest.fn().mockResolvedValue([{ id: 1 }]),
    };
    const mockShiftsRepo = {
      findByExternalId: jest.fn(),
      findOverlappingShift: jest.fn(),
      upsert: jest.fn().mockResolvedValue([{ id: 1 }]),
    };
    const mockSyncRunsRepo = {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn().mockResolvedValue({ id: 1 }),
      findAllOrdered: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: EmployeesRepository, useValue: mockEmployeesRepo },
        { provide: ShiftsRepository, useValue: mockShiftsRepo },
        { provide: SyncRunsRepository, useValue: mockSyncRunsRepo },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    employeesRepo = module.get(EmployeesRepository);
    shiftsRepo = module.get(ShiftsRepository);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncEmployees', () => {
    it('should insert new employees and update existing ones', async () => {
      const stats = {
        read: 0,
        inserted: 0,
        updated: 0,
        errored: 0,
        issues: [] as string[],
        source: SyncSource.File,
      };
      const rows = [
        {
          external_id: 'E1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          hourly_rate: '20.00',
          active: 'true',
        },
        {
          external_id: 'E2',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          hourly_rate: '25.00',
          active: 'true',
        },
      ];

      employeesRepo.findByExternalId
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ externalId: 'E2' } as Employee);

      await service['syncEmployees'](stats, rows);

      expect(stats.inserted).toBe(1);
      expect(stats.updated).toBe(1);
      expect(employeesRepo.upsert).toHaveBeenCalledTimes(2);
    });
  });

  describe('syncShifts', () => {
    it('should correctly calculate workMinutes and earningsCents', async () => {
      const stats = {
        read: 0,
        inserted: 0,
        updated: 0,
        errored: 0,
        issues: [] as string[],
        source: 'File',
      };
      const rows = [
        {
          external_id: 'S1',
          employee_external_id: 'E1',
          start_at: '2026-03-01T09:00:00Z',
          end_at: '2026-03-01T17:00:00Z',
          break_minutes: '30',
        },
      ];

      employeesRepo.findByExternalId.mockResolvedValue({
        externalId: 'E1',
        hourlyRateCents: 2000,
      } as Employee);
      shiftsRepo.findByExternalId.mockResolvedValue(undefined);
      shiftsRepo.findOverlappingShift.mockResolvedValue(undefined);

      await service['syncShifts'](stats, rows);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(shiftsRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          workMinutes: 450,
          earningsCents: 15000,
        }),
      );
    });

    it('should record error if employee not found', async () => {
      const stats = {
        read: 0,
        inserted: 0,
        updated: 0,
        errored: 0,
        issues: [] as string[],
        source: 'File',
      };
      const rows = [
        {
          external_id: 'S1',
          employee_external_id: 'UNKNOWN',
          start_at: '2026-03-01T09:00:00Z',
          end_at: '2026-03-01T10:00:00Z',
          break_minutes: '0',
        },
      ];

      employeesRepo.findByExternalId.mockResolvedValue(undefined);

      await service['syncShifts'](stats, rows);

      expect(stats.errored).toBe(1);
      expect(stats.issues[0]).toContain(
        'Referenced employee UNKNOWN not found',
      );
    });

    it('should detect overlapping shifts', async () => {
      const stats = {
        read: 0,
        inserted: 0,
        updated: 0,
        errored: 0,
        issues: [] as string[],
        source: 'File',
      };
      const rows = [
        {
          external_id: 'S2',
          employee_external_id: 'E1',
          start_at: '2026-03-01T10:00:00Z',
          end_at: '2026-03-01T12:00:00Z',
          break_minutes: '0',
        },
      ];

      employeesRepo.findByExternalId.mockResolvedValue({
        externalId: 'E1',
        hourlyRateCents: 2000,
      } as Employee);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (shiftsRepo.findOverlappingShift as jest.Mock).mockResolvedValue({
        externalId: 'EXISTING',
      });

      await service['syncShifts'](stats, rows);

      expect(stats.errored).toBe(1);
      expect(stats.issues[0]).toContain(
        'Overlaps with existing shift EXISTING',
      );
    });

    it('should correctly track inserted vs updated shifts', async () => {
      const stats = {
        read: 0,
        inserted: 0,
        updated: 0,
        errored: 0,
        issues: [] as string[],
        source: 'File' as const,
      };
      const rows = [
        {
          external_id: 'NEW',
          employee_external_id: 'E1',
          start_at: '2026-03-01T09:00:00Z',
          end_at: '2026-03-01T17:00:00Z',
          break_minutes: '0',
        },
        {
          external_id: 'EXISTING',
          employee_external_id: 'E1',
          start_at: '2026-03-02T09:00:00Z',
          end_at: '2026-03-02T17:00:00Z',
          break_minutes: '0',
        },
      ];

      employeesRepo.findByExternalId.mockResolvedValue({
        externalId: 'E1',
        hourlyRateCents: 2000,
      } as Employee);

      shiftsRepo.findOverlappingShift.mockResolvedValue(undefined);
      shiftsRepo.findByExternalId
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ externalId: 'EXISTING' } as Shift);

      await service['syncShifts'](stats, rows);

      expect(stats.inserted).toBe(1);
      expect(stats.updated).toBe(1);
    });
  });
});

describe('ShiftsRepository', () => {
  let repository: ShiftsRepository;
  let mockDb: {
    query: { shifts: { findFirst: jest.Mock } };
    select: jest.Mock;
    from: jest.Mock;
    where: jest.Mock;
    update: jest.Mock;
    set: jest.Mock;
    returning: jest.Mock;
    insert: jest.Mock;
    values: jest.Mock;
  };

  beforeEach(async () => {
    mockDb = {
      query: {
        shifts: {
          findFirst: jest.fn(),
        },
      },
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ShiftsRepository, { provide: DRIZZLE, useValue: mockDb }],
    }).compile();

    repository = module.get<ShiftsRepository>(ShiftsRepository);
  });

  describe('findOverlappingShift', () => {
    const employeeId = 'emp1';
    const start = new Date('2026-03-04T09:00:00Z');
    const end = new Date('2026-03-04T17:00:00Z');

    it('should call findFirst with correct conditions for overlap', async () => {
      await repository.findOverlappingShift(employeeId, start, end);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockDb.query.shifts.findFirst).toHaveBeenCalled();
    });
  });

  describe('upsert', () => {
    const shift = {
      externalId: 'shift1',
      employeeExternalId: 'emp1',
      startAt: new Date(),
      endAt: new Date(),
      breakMinutes: 30,
      workMinutes: 450,
      earningsCents: 15000,
      source: SyncSource.File,
    };

    it('should update if shift exists', async () => {
      jest
        .spyOn(repository, 'findByExternalId')
        .mockResolvedValue({ id: 1 } as Shift);

      await repository.upsert(shift);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.update).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should insert if shift does not exist', async () => {
      jest.spyOn(repository, 'findByExternalId').mockResolvedValue(undefined);

      await repository.upsert(shift);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.insert).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.update).not.toHaveBeenCalled();
    });
  });
});
