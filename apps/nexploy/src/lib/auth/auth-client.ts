import { createAuthClient } from 'better-auth/react';
import { adminClient, twoFactorClient } from 'better-auth/client/plugins';
import { permission } from '@/lib/auth/permissions';

export const authClient = createAuthClient({
    plugins: [adminClient(permission), twoFactorClient()],
});
