import {
  Controller,
  Get,
  Query,
  Param,
  HttpException,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import * as employeesSchema from './models/employees.schema';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(employeesSchema.GetEmployeesQuerySchema))
  async getEmployees(@Query() query: employeesSchema.GetEmployeesQuery) {
    return await this.employeesService.getEmployees(query.days);
  }

  @Get(':externalId/shifts')
  async getShiftsForEmployee(
    @Param('externalId') externalId: string,
    @Query() query: employeesSchema.GetShiftsQuery,
  ) {
    const result = await this.employeesService.getShiftsForEmployee(
      externalId,
      query,
    );

    if (!result) {
      throw new HttpException(
        `Employee with externalId "${externalId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }
}
