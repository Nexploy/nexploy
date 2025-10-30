import { z } from 'zod';

const Password = (t: any) =>
    z
        .string({
            error: t('required'),
        })
        .min(8, { message: t('passwordMin', { min: 8 }) })
        .max(30, { message: t('passwordMax', { max: 30 }) });

const Email = (t: any) => z.email({ message: t('invalidEmail') });

const Name = (t: any) =>
    z
        .string({
            error: t('required'),
        })
        .min(2, { message: t('nameMin', { min: 2 }) })
        .max(50, { message: t('nameMax', { max: 50 }) });

export const SignInFormSchema = (t: any) =>
    z.object({
        email: Email(t),
        password: Password(t),
    });

export const SetupFormSchema = (t: any) =>
    z
        .object({
            name: Name(t),
            email: Email(t),
            password: Password(t),
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

export type TypeSetupFormSchema = z.infer<ReturnType<typeof SetupFormSchema>>;
