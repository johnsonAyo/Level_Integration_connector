import { ZodError } from 'zod';

export function formatZodError(err: unknown): string {
  if (err instanceof ZodError) {
    return err.issues
      .map((issue) => {
        const path = issue.path.join('.');
        const message = issue.message;
        return `${path}: ${message}`;
      })
      .join(', ');
  }
  const message = err instanceof Error ? err.message : String(err);
  return message;
}
