import { z } from 'zod';

const password = (t: any) =>
    z
        .string({
            error: t('required'),
        })
        .min(8, { message: t('passwordMin', { min: 8 }) })
        .max(30, { message: t('passwordMax', { max: 30 }) });

const email = (t: any) => z.email({ message: t('invalidEmail') });

const name = (t: any) =>
    z
        .string({
            error: t('required'),
        })
        .min(2, { message: t('nameMin', { min: 2 }) })
        .max(50, { message: t('nameMax', { max: 50 }) });

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
                    error: t('required'),
                })
                .min(1, { message: t('required') }),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t('passwordsMustMatch'),
            path: ['confirmPassword'],
        });

export type TypeSetupFormSchema = z.infer<ReturnType<typeof setupFormSchema>>;
