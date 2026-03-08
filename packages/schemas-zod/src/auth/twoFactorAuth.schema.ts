import { z } from 'zod';
import { password } from './common.schema';

export const twoFactorAuthSchema = (t: any) =>
    z.object({
        password: password(t),
    });

export type TypeTwoFactorAuthSchema = z.infer<ReturnType<typeof twoFactorAuthSchema>>;

export const twoFactorAuthCodeSchema = (t: any) =>
    z.object({
        code: z.string().min(1, t('required')),
        trustDevice: z.boolean().default(false),
    });

export type TypeTwoFactorAuthCodeSchema = z.infer<ReturnType<typeof twoFactorAuthCodeSchema>>;
