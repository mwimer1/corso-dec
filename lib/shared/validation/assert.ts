import type { ZodTypeAny } from 'zod';
import { ValidationError } from '../errors/validation-error';

export function assertZodSchema<T>(schema: ZodTypeAny, data: unknown): T {
  const res = schema.safeParse(data);
  if (!res.success) throw ValidationError.fromZodError(res.error, 'Invalid data');
  return res.data as T;
}



