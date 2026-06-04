import { createAuthClient } from 'better-auth/react';
import { adminClient, twoFactorClient } from 'better-auth/client/plugins';
import { apiKeyClient } from '@better-auth/api-key/client';
import { permission } from '@/lib/auth/permissions';

export const authClient = createAuthClient({
    plugins: [adminClient(permission), twoFactorClient(), apiKeyClient()],
});
