import { z } from 'zod';

export const password = (t: any) =>
    z
        .string({
            error: t('required'),
        })
        .min(8, { message: t('passwordMin', { min: 8 }) })
        .max(30, { message: t('passwordMax', { max: 30 }) });

export const email = (t: any) => z.email({ message: t('invalidEmail') });

export const name = (t: any) =>
    z
        .string({
            error: t('required'),
        })
        .min(2, { message: t('nameMin', { min: 2 }) })
        .max(50, { message: t('nameMax', { max: 50 }) });
