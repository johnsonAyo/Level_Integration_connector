import { z } from 'zod';

export const EmployeeCsvSchema = z.object({
  external_id: z.string().min(1, { message: 'Employee ID is required' }),
  first_name: z.string().min(1, { message: 'First name is required' }),
  last_name: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email().toLowerCase().nullable().optional().or(z.literal('').transform(() => null)),
  hourly_rate: z.string().transform((val) => parseFloat(val)).refine((val) => val > 0, { message: "Hourly rate must be a positive number" }),
  active: z.string().transform((val) => val.toLowerCase() === 'true'),
});

export const ShiftCsvSchema = z.object({
  external_id: z.string().min(1, { message: 'Shift ID is required' }),
  employee_external_id: z.string().min(1, { message: 'Employee ID is required' }),
  start_at: z.string().datetime({ offset: true, message: 'Start date must be a valid ISO 8601 string' }),
  end_at: z.string().datetime({ offset: true, message: 'End date must be a valid ISO 8601 string' }),
  break_minutes: z.string().transform((val) => val ? parseInt(val, 10) : 0),
});

export type EmployeeCsv = z.infer<typeof EmployeeCsvSchema>;
export type ShiftCsv = z.infer<typeof ShiftCsvSchema>;
