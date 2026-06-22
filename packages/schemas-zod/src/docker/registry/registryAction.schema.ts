import { z } from 'zod';

export const registryLoginSchema = z.object({
    serveraddress: z.string().min(1),
    username: z.string().min(1),
    password: z.string().min(1),
});

export const registryLogoutSchema = z.object({
    serveraddress: z.string().min(1),
});

export const registryPingSchema = z.object({
    serveraddress: z.string().min(1),
});
