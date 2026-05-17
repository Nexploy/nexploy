import { z } from 'zod';
import { password } from './common.schema';

export const twoFactorAuthSchema = z.object({
    password,
});

export type TypeTwoFactorAuthSchema = z.infer<typeof twoFactorAuthSchema>;

export const twoFactorAuthCodeSchema = z.object({
    code: z.string().min(1, 'Code is required'),
    trustDevice: z.boolean().default(false),
});

export type TypeTwoFactorAuthCodeSchema = z.infer<typeof twoFactorAuthCodeSchema>;
