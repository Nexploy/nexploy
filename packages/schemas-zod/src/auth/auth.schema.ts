import { z } from 'zod';
import { Role } from './permissions.ts';
import { email, name, password } from './common.schema.ts';

export const signInFormSchema = (t: any) =>
    z.object({
        email: email(t),
        password: password(t),
    });

export const setupFormSchema = (t: any) =>
    z
        .object({
            name: name(t),
            email: email(t),
            password: password(t),
            confirmPassword: z
                .string({
                    error: t('fieldRequired', { field: t('fieldNames.confirmPassword') }),
                })
                .min(1, { message: t('fieldRequired', { field: t('fieldNames.confirmPassword') }) }),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t('passwordsMustMatch'),
            path: ['confirmPassword'],
        });

export type TypeSetupFormSchema = z.infer<ReturnType<typeof setupFormSchema>>;

export const changeUsernameFormSchema = (t: any) =>
    z.object({
        newName: name(t),
    });

export type TypeChangeUsernameFormSchema = z.infer<ReturnType<typeof changeUsernameFormSchema>>;

export const changePasswordFormSchema = (t: any) =>
    z
        .object({
            currentPassword: z
                .string({
                    error: t('fieldRequired', { field: t('fieldNames.currentPassword') }),
                })
                .min(1, { message: t('fieldRequired', { field: t('fieldNames.currentPassword') }) }),
            newPassword: password(t),
            confirmPassword: z
                .string({
                    error: t('fieldRequired', { field: t('fieldNames.confirmPassword') }),
                })
                .min(1, { message: t('fieldRequired', { field: t('fieldNames.confirmPassword') }) }),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
            message: t('passwordsMustMatch'),
            path: ['confirmPassword'],
        });

export type TypeChangePasswordFormSchema = z.infer<ReturnType<typeof changePasswordFormSchema>>;

export const createUserFormSchema = (t: any) =>
    z
        .object({
            name: name(t),
            email: email(t),
            password: password(t),
            confirmPassword: z.string().min(1, { message: t('passwordsMustMatch') }),
            role: z.enum(['admin', 'readWrite', 'read'] as Role[]),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t('passwordsMustMatch'),
            path: ['confirmPassword'],
        });

export type TypeCreateUserFormSchema = z.infer<ReturnType<typeof createUserFormSchema>>;
