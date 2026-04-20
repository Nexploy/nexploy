import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../../../prisma/prisma';
import { nextCookies } from 'better-auth/next-js';
import { admin, twoFactor } from 'better-auth/plugins';
import { apiKey } from '@better-auth/api-key';
import { permission } from '@/lib/auth/permissions';

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),
    account: {
        accountLinking: {
            enabled: true,
            allowDifferentEmails: true,
            trustedProviders: ['github', 'gitlab'],
        },
    },
    emailAndPassword: {
        enabled: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
    },
    appName: 'Nexploy',
    plugins: [
        admin(permission),
        twoFactor({
            backupCodeOptions: {
                storeBackupCodes: 'encrypted',
            },
        }),
        apiKey({
            enableSessionForAPIKeys: true,
            apiKeyHeaders: ['x-api-key'],
            enableMetadata: true,
        }),
        nextCookies(),
    ],
});

export type Session = typeof auth.$Infer.Session;
