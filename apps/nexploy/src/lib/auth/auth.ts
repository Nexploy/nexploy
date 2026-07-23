import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../../../prisma/prisma';
import { nextCookies } from 'better-auth/next-js';
import { admin, mcp, organization, twoFactor } from 'better-auth/plugins';
import { apiKey } from '@better-auth/api-key';
import { orgAc, orgAdmin, orgMember, orgOwner } from './orgPermissions';
import { permission } from './permissions';

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
        disableSignUp: true,
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
        organization({
            ac: orgAc,
            roles: { owner: orgOwner, admin: orgAdmin, member: orgMember },
            creatorRole: 'owner',
            allowUserToCreateOrganization: (user) =>
                user.role === 'developer' || user.role === 'admin',
            membershipLimit: 100,
            invitationExpiresIn: 60 * 60 * 24 * 7,
            requireEmailVerificationOnInvitation: false,
        }),
        nextCookies(),
    ],
});

export type Session = typeof auth.$Infer.Session;
