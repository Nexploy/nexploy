import { createAuthClient } from 'better-auth/react';
import { adminClient, organizationClient, twoFactorClient } from 'better-auth/client/plugins';
import { apiKeyClient } from '@better-auth/api-key/client';
import { permission } from '@/lib/auth/permissions';
import { orgAc, orgAdmin, orgMember, orgOwner } from '@/lib/auth/orgPermissions';

export const authClient = createAuthClient({
    plugins: [
        adminClient(permission),
        twoFactorClient(),
        apiKeyClient(),
        organizationClient({ ac: orgAc, roles: { owner: orgOwner, admin: orgAdmin, member: orgMember } }),
    ],
});
