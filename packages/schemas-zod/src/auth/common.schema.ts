import { z } from 'zod';

export const password = z
    .string({ error: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(30, { message: 'Password cannot exceed 30 characters' });

export const email = z.email({ message: 'Invalid email address' });

export const name = z
    .string({ error: 'Name is required' })
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(50, { message: 'Name cannot exceed 50 characters' });
