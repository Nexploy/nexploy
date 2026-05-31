import { decrypt, encrypt } from '@/lib/encryption';
import { GitProviderType } from 'generated/client';

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

export function verifyOAuthState(stateParam: string): OAuthStatePayload {
    const decoded = decodeURIComponent(stateParam);
    const decrypted = decrypt(decoded);

    let payload: OAuthStatePayload;
    try {
        payload = JSON.parse(decrypted);
    } catch {
        throw new Error('Invalid OAuth state');
    }

    if (!payload.userId || !payload.provider || !payload.gitProviderId || !payload.expiresAt) {
        throw new Error('Invalid OAuth state');
    }

    if (Date.now() > payload.expiresAt) {
        throw new Error('OAuth state expired');
    }

    return payload;
}
