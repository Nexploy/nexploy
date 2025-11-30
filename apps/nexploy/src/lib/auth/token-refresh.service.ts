import { updateGitProviderToken } from '@/services/git/git.service';
import { GetGitProviderToken } from '@workspace/typescript-interface/git';
import { env } from '../../../env';

class TokenRefreshService {
    async getValidToken(
        token: GetGitProviderToken,
        provider: string,
        userId: string,
    ): Promise<string | null> {
        if (!token.accessTokenExpiresAt) {
            return token.accessToken;
        }

        if (new Date(token.accessTokenExpiresAt) < new Date()) {
            if (provider === 'gitlab') {
                return await this.refreshGitLabToken(token, userId);
            } else if (provider === 'github') {
                console.warn(
                    `GitHub access token expired for user ${userId}. User must re-authenticate.`,
                );
                return null;
            } else {
                throw new Error(`Unknown provider: ${provider}`);
            }
        }

        return token.accessToken;
    }

    private async refreshGitLabToken(token: GetGitProviderToken, userId: string): Promise<string> {
        if (!token.refreshToken) {
            throw new Error('No refresh token available for GitLab');
        }

        const clientId = env.GITLAB_CLIENT_ID;
        const clientSecret = env.GITLAB_CLIENT_SECRET;

        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: token.refreshToken,
        });

        const response = await fetch(`https://gitlab.com/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(
                `Failed to refresh token. Status ${response.status}. Message: ${message}`,
            );
        }

        const data = await response.json();

        const expiresAt = new Date(Date.now() + data.expires_in * 1000);

        await updateGitProviderToken('gitlab', userId, {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            accessTokenExpiresAt: expiresAt,
        });

        return data.access_token;
    }
}

export const tokenRefreshService = new TokenRefreshService();
