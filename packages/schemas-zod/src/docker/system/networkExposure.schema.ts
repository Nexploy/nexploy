import { z } from 'zod';

export const LOOPBACK_HOST_IP = '127.0.0.1';

export const ALL_INTERFACES_HOST_IP = '';

export const networkExposureSettingsSchema = z.object({
    bindLoopbackOnly: z.boolean(),
});

export type UpdateNetworkExposureSettings = z.infer<typeof networkExposureSettingsSchema>;
