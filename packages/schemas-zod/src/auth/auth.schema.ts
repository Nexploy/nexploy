import { z } from 'zod';
import { email, name, password } from './common.schema';

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

export const changeUsernameFormSchema = (t: any) =>
    z.object({
        newName: name(t),
    });

export type TypeChangeUsernameFormSchema = z.infer<ReturnType<typeof changeUsernameFormSchema>>;
