export interface GitProviderToken {
    accessToken: string | null;
    refreshToken: string | null;
    accessTokenExpiresAt: Date | null;
}
