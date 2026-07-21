import { apiKey } from '@better-auth/api-key';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import type { PrismaClient } from 'generated/client';

export const createSeedAuth = (prisma: PrismaClient) =>
    betterAuth({
        appName: 'Nexploy',
        database: prismaAdapter(prisma, {
            provider: 'postgresql',
        }),
        plugins: [
            apiKey({
                enableSessionForAPIKeys: true,
                apiKeyHeaders: ['x-api-key'],
                enableMetadata: true,
            }),
        ],
    });
