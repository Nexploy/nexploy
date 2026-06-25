import dayjs from 'dayjs';
import { GitProviderType } from 'generated/client';
import { prisma } from '@/../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import { getUserSession } from '@/services/auth/auth.service';
import { GitProviderToken } from '@workspace/typescript-interface/git/git';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { getGitAdapter } from '@/services/git/core/registry';
import { getGitProviderCredentials } from '@/services/git/gitProviders.service';

export async function getGitProviderToken(
    provider: GitProviderType,
    { gitAccountId, requestedUserId }: { gitAccountId?: string; requestedUserId?: string } = {},
): Promise<GitProviderToken> {
    const t = await getErrorTranslator();
    const userId = requestedUserId ?? (await getUserSession())?.user.id;
    if (!userId) throw new Error(t('git.unauthorized'));

    const gitAccount = await prisma.gitAccount.findFirst({
        where: {
            userId,
            provider,
            ...(gitAccountId && { id: gitAccountId }),
        },
        select: {
            accessToken: true,
            accessTokenExpiresAt: true,
            refreshToken: true,
        },
    });

    if (!gitAccount?.accessToken) {
        throw new Error(t('git.noAccessToken', { provider }));
    }

    return {
        accessToken: decrypt(gitAccount.accessToken),
        refreshToken: gitAccount.refreshToken ? decrypt(gitAccount.refreshToken) : null,
        accessTokenExpiresAt: gitAccount.accessTokenExpiresAt,
    };
}

export async function updateGitProviderToken(
    provider: GitProviderType,
    userId: string,
    tokenData: GitProviderToken,
    gitAccountId?: string,
): Promise<void> {
    const t = await getErrorTranslator();
    try {
        const gitAccount = await prisma.gitAccount.findFirst({
            where: {
                provider,
                userId,
                ...(gitAccountId && { id: gitAccountId }),
            },
        });

        if (!gitAccount) throw new Error(t('git.noAccountForUser', { provider }));

        await prisma.gitAccount.update({
            where: { id: gitAccount.id },
            data: {
                accessToken: tokenData.accessToken ? encrypt(tokenData.accessToken) : undefined,
                refreshToken: tokenData.refreshToken ? encrypt(tokenData.refreshToken) : null,
                accessTokenExpiresAt: tokenData.accessTokenExpiresAt,
            },
        });
    } catch (error: unknown) {
        throw new Error(t('git.updateTokenFailed'));
    }
}

export async function getValidToken(
    token: GitProviderToken,
    provider: GitProviderType,
    userId: string,
    gitAccountId?: string,
): Promise<GitProviderToken> {
    const t = await getErrorTranslator();
    if (!token.accessTokenExpiresAt) {
        return token;
    }

    if (dayjs(token.accessTokenExpiresAt).isBefore(dayjs())) {
        try {
            return await refreshToken(token, provider, userId, gitAccountId);
        } catch {
            const freshToken = await getGitProviderToken(provider, {
                gitAccountId,
                requestedUserId: userId,
            });
            if (
                !freshToken.accessTokenExpiresAt ||
                dayjs(freshToken.accessTokenExpiresAt).isAfter(dayjs())
            ) {
                return freshToken;
            }
            throw new Error(t('gitProvider.oauthTokenExpired', { provider }));
        }
    }

    return token;
}

async function refreshToken(
    token: GitProviderToken,
    provider: GitProviderType,
    userId: string,
    gitAccountId?: string,
): Promise<GitProviderToken> {
    const t = await getErrorTranslator();
    if (!token.refreshToken) {
        throw new Error(t('gitProvider.noRefreshToken', { provider }));
    }

    const credentials = await getGitProviderCredentials(provider, gitAccountId);
    if (!credentials) {
        throw new Error(t('gitProvider.providerNotConfigured', { provider }));
    }

    const newToken = await getGitAdapter(provider).refreshToken({
        refreshToken: token.refreshToken,
        credentials,
    });

    await updateGitProviderToken(provider, userId, newToken, gitAccountId);

    return newToken;
}
