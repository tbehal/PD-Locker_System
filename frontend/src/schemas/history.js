import { z } from 'zod';

export const nameSearchSchema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters').max(150, 'Name is too long'),
});
