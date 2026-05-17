import { z } from 'zod';
import { Role } from './permissions.ts';
import { email, name, password } from './common.schema.ts';

export const signInFormSchema = z.object({
    email,
    password,
});

export const setupFormSchema = z
    .object({
        name,
        email,
        password,
        confirmPassword: z
            .string({ error: 'Confirm password is required' })
            .min(1, { message: 'Confirm password is required' }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords must match',
        path: ['confirmPassword'],
    });

export type TypeSetupFormSchema = z.infer<typeof setupFormSchema>;

export const changeUsernameFormSchema = z.object({
    newName: name,
});

export type TypeChangeUsernameFormSchema = z.infer<typeof changeUsernameFormSchema>;

export const changePasswordFormSchema = z
    .object({
        currentPassword: z
            .string({ error: 'Current password is required' })
            .min(1, { message: 'Current password is required' }),
        newPassword: password,
        confirmPassword: z
            .string({ error: 'Confirm password is required' })
            .min(1, { message: 'Confirm password is required' }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords must match',
        path: ['confirmPassword'],
    });

export type TypeChangePasswordFormSchema = z.infer<typeof changePasswordFormSchema>;

export const createUserFormSchema = z
    .object({
        name,
        email,
        password,
        confirmPassword: z.string().min(1, { message: 'Passwords must match' }),
        role: z.enum(['admin', 'readWrite', 'read'] as Role[]),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords must match',
        path: ['confirmPassword'],
    });

export type TypeCreateUserFormSchema = z.infer<typeof createUserFormSchema>;
