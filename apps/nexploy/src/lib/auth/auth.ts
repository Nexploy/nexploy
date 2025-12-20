import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../../../prisma/prisma';
import { nextCookies } from 'better-auth/next-js';
import { admin, apiKey, twoFactor } from 'better-auth/plugins';
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
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            scope: ['user:email', 'read:user', 'repo'],
        },
        gitlab: {
            clientId: process.env.GITLAB_CLIENT_ID as string,
            clientSecret: process.env.GITLAB_CLIENT_SECRET,
            scope: ['read_user', 'read_repository', 'api'],
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
                storeBackupCodes: 'plain',
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
