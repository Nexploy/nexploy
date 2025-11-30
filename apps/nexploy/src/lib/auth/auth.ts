import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../../../prisma/prisma';
import { nextCookies } from 'better-auth/next-js';
import { admin, twoFactor } from 'better-auth/plugins';
import { env } from '../../../env';

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
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
        },
        gitlab: {
            clientId: env.GITLAB_CLIENT_ID,
            clientSecret: env.GITLAB_CLIENT_SECRET,
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
        admin(),
        twoFactor({
            backupCodeOptions: {
                storeBackupCodes: 'plain',
            },
        }),
        nextCookies(),
    ],
});

export type Session = typeof auth.$Infer.Session;
