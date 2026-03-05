import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DbModule } from './db/db.module.js';
import { SyncModule } from './modules/sync/sync.module.js';
import { EmployeesModule } from './modules/employees/employees.module.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [DbModule, SyncModule, EmployeesModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
