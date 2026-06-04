import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../../../prisma/prisma';
import { nextCookies } from 'better-auth/next-js';
import { admin, mcp, twoFactor } from 'better-auth/plugins';
import { apiKey } from '@better-auth/api-key';
import { permission } from '@/lib/auth/permissions.ts';

const extraTrustedOrigins = process.env.TRUSTED_ORIGINS
    ? process.env.TRUSTED_ORIGINS.split(',')
          .map((o) => o.trim())
          .filter(Boolean)
    : [];

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),
    trustedOrigins: extraTrustedOrigins,
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
        mcp({
            loginPage: '/signin',
            oidcConfig: {
                loginPage: '/signin',
                accessTokenExpiresIn: 60 * 60 * 24,
                refreshTokenExpiresIn: 60 * 60 * 24 * 30,
            },
        }),
        nextCookies(),
    ],
});

export type Session = typeof auth.$Infer.Session;
