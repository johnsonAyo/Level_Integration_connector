import { Module, forwardRef } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { ShiftsRepository } from './repositories/shifts.repository';
import { SyncRunsRepository } from './repositories/sync-runs.repository';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [forwardRef(() => EmployeesModule)],
  controllers: [SyncController],
  providers: [SyncService, ShiftsRepository, SyncRunsRepository],
  exports: [ShiftsRepository],
})
export class SyncModule {}
