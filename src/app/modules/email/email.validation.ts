import { z } from 'zod';

const create = z.object({
  body: z.object({
    name: z.string({ required_error: 'Brand is Required' }),
    email: z.string({ required_error: 'Email is Required' }),
    details: z.string({ required_error: 'Details is Required' }),
  }),
});

export const EmailValidation = {
  create,
};
