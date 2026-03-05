import { z } from 'zod';

export const GetShiftsQuerySchema = z
  .object({
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return new Date(data.from) <= new Date(data.to);
      }
      return true;
    },
    {
      message: '"from" date cannot be after "to" date',
      path: ['from'],
    },
  );

export type GetShiftsQuery = z.infer<typeof GetShiftsQuerySchema>;

export const GetEmployeesQuerySchema = z.object({
  days: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 7)),
});

export type GetEmployeesQuery = z.infer<typeof GetEmployeesQuerySchema>;
