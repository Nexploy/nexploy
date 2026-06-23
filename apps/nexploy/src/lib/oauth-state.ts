import { decrypt, encrypt } from '@/lib/encryption';
import { GitProviderType } from 'generated/client';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

const STATE_EXPIRY_MS = 10 * 60 * 1000;

interface OAuthStatePayload {
    userId: string;
    provider: GitProviderType;
    gitProviderId: string;
    expiresAt: number;
}

export function generateOAuthState(params: {
    userId: string;
    provider: GitProviderType;
    gitProviderId: string;
}): string {
    const payload: OAuthStatePayload = {
        ...params,
        expiresAt: Date.now() + STATE_EXPIRY_MS,
    };
    const encrypted = encrypt(JSON.stringify(payload));
    return encodeURIComponent(encrypted);
}

export async function verifyOAuthState(stateParam: string): Promise<OAuthStatePayload> {
    const t = await getErrorTranslator();
    const decoded = decodeURIComponent(stateParam);
    const decrypted = decrypt(decoded);

    let payload: OAuthStatePayload;
    try {
        payload = JSON.parse(decrypted);
    } catch {
        throw new Error(t('oauth.invalidState'));
    }

    if (!payload.userId || !payload.provider || !payload.gitProviderId || !payload.expiresAt) {
        throw new Error(t('oauth.invalidState'));
    }

    if (Date.now() > payload.expiresAt) {
        throw new Error(t('oauth.stateExpired'));
    }

    return payload;
}
