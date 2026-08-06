export type ExemptionCategory =
    | 'public'
    | 'framework'
    | 'internal-api-key'
    | 'self-service'
    | 'session-scoped'
    | 'org-role-check'
    | 'delegated-auth';

export interface Exemption {
    category: ExemptionCategory;
    reason: string;
    review?: string;
}

export const GUARD_EXEMPTIONS: Record<string, Exemption> = {
    'POST src/app/api/webhooks/github/route.ts': {
        category: 'public',
        reason: 'Git provider webhook, authenticated by its HMAC signature, not by a user session',
    },
    'POST src/app/api/webhooks/gitlab/route.ts': {
        category: 'public',
        reason: 'Git provider webhook, authenticated by its shared secret token',
    },
    'POST src/app/api/webhooks/gitea/route.ts': {
        category: 'public',
        reason: 'Git provider webhook, authenticated by its HMAC signature',
    },
    'POST src/app/api/webhooks/bitbucket/route.ts': {
        category: 'public',
        reason: 'Git provider webhook, authenticated by its shared secret token',
    },
    'POST src/app/api/webhooks/azure-repos/route.ts': {
        category: 'public',
        reason: 'Git provider webhook, authenticated by its shared secret token',
    },

    'GET src/app/api/[...all]/route.ts': {
        category: 'framework',
        reason: 'Better Auth catch-all handler; it owns its own authentication',
    },
    'POST src/app/api/[...all]/route.ts': {
        category: 'framework',
        reason: 'Better Auth catch-all handler; it owns its own authentication',
    },
    'GET src/app/api/inngest/route.ts': {
        category: 'framework',
        reason: 'Inngest serve handler, authenticated by the Inngest signing key',
    },
    'POST src/app/api/inngest/route.ts': {
        category: 'framework',
        reason: 'Inngest serve handler, authenticated by the Inngest signing key',
    },
    'PUT src/app/api/inngest/route.ts': {
        category: 'framework',
        reason: 'Inngest serve handler, authenticated by the Inngest signing key',
    },
    'GET src/app/api/mcp/route.ts': {
        category: 'framework',
        reason: 'Better Auth MCP handler; OAuth bearer tokens are verified by the plugin',
    },
    'POST src/app/api/mcp/route.ts': {
        category: 'framework',
        reason: 'Better Auth MCP handler; OAuth bearer tokens are verified by the plugin',
    },
    'DELETE src/app/api/mcp/route.ts': {
        category: 'framework',
        reason: 'Better Auth MCP handler; OAuth bearer tokens are verified by the plugin',
    },

    'GET src/app/api/internal/docker-api-key/route.ts': {
        category: 'internal-api-key',
        reason: 'Service-to-service endpoint for docker-api',
    },
    'GET src/app/api/internal/repository-organizations/route.ts': {
        category: 'internal-api-key',
        reason: 'Service-to-service endpoint for docker-api',
    },
    'POST src/app/api/internal/verify-api-key/route.ts': {
        category: 'internal-api-key',
        reason: 'Service-to-service endpoint used by docker-api to verify Nexploy API keys',
    },
    'POST src/app/api/internal/versions/sync-delete/route.ts': {
        category: 'internal-api-key',
        reason: 'Service-to-service endpoint for docker-api, guarded by internalApiAuth',
    },
    'POST src/app/api/internal/volumes/sync-delete/route.ts': {
        category: 'internal-api-key',
        reason: 'Service-to-service endpoint for docker-api, guarded by internalApiAuth',
    },

    'src/actions/auth/signIn.action.ts#onSignInAction': {
        category: 'public',
        reason: 'Sign-in must run without a session',
    },
    'src/actions/auth/setup.action.ts#onSetupAction': {
        category: 'public',
        reason: 'First-run setup creates the initial admin before any session exists',
    },
    'src/actions/auth/twoFactorAuthVerifCode.action.ts#twoFactorAuthVerifCodeAction': {
        category: 'public',
        reason: 'Second factor is verified between sign-in and session creation',
    },
    'src/actions/auth/twoFactorAuthUseBackupCode.action.ts#twoFactorAuthUseBackupCodeAction': {
        category: 'public',
        reason: 'Backup code is verified between sign-in and session creation',
    },
    'src/actions/auth/changeUsername.action.ts#onChangeUsernameAction': {
        category: 'delegated-auth',
        reason: 'Renames the caller account through Better Auth, which rejects the call without a session',
        review: 'Uses actionServer instead of authActionServer, so it skips the banned-account check',
    },
    'src/actions/auth/twoFactorAuthEnable.action.ts#onTwoFactorAuthEnableAction': {
        category: 'self-service',
        reason: 'Acts on the caller own two-factor settings',
    },
    'src/actions/auth/twoFactorAuthDisable.action.ts#onTwoFactorAuthDisableAction': {
        category: 'self-service',
        reason: 'Acts on the caller own two-factor settings',
    },
    'src/actions/git/disconnectGitAccount.action.ts#disconnectGitAccountAction': {
        category: 'self-service',
        reason: 'Disconnects a git account owned by the caller',
    },
    'src/actions/tasks/cancelTask.action.ts#onTaskCancelAction': {
        category: 'self-service',
        reason: 'requireManageableTask resolves the task owner and rejects other callers',
    },

    'src/actions/organization/createOrganization.action.ts#createOrganizationAction': {
        category: 'session-scoped',
        reason: 'Better Auth allowUserToCreateOrganization restricts creation to developer and admin',
    },
    'src/actions/organization/setActiveOrganization.action.ts#setActiveOrganizationAction': {
        category: 'session-scoped',
        reason: 'Better Auth verifies the caller membership before switching the active organization',
    },
    'src/actions/organization/acceptInvitation.action.ts#acceptInvitationAction': {
        category: 'session-scoped',
        reason: 'The invitation is resolved from the caller email',
    },
    'src/actions/organization/rejectInvitation.action.ts#rejectInvitationAction': {
        category: 'session-scoped',
        reason: 'The invitation is resolved from the caller email',
    },
    'src/actions/organization/inviteMember.action.ts#inviteMemberAction': {
        category: 'org-role-check',
        reason: 'Inline getCallerOrgRole check requires owner or admin in the target organization',
    },
    'src/actions/organization/cancelInvitation.action.ts#cancelInvitationAction': {
        category: 'org-role-check',
        reason: 'Inline getCallerOrgRole check requires owner or admin in the target organization',
    },
    'src/actions/organization/removeMember.action.ts#removeMemberAction': {
        category: 'org-role-check',
        reason: 'Inline getCallerOrgRole check requires owner or admin in the target organization',
    },
    'src/actions/organization/updateMemberRole.action.ts#updateMemberRoleAction': {
        category: 'org-role-check',
        reason: 'Inline getCallerOrgRole check requires owner or admin in the target organization',
    },
    'src/actions/organization/updateOrganization.action.ts#updateOrganizationAction': {
        category: 'org-role-check',
        reason: 'Inline getCallerOrgRole check requires owner or admin in the target organization',
    },
    'src/actions/organization/deleteOrganization.action.ts#deleteOrganizationAction': {
        category: 'org-role-check',
        reason: 'Inline getCallerOrgRole check requires owner in the target organization',
    },
    'src/actions/organization/leaveOrganization.action.ts#leaveOrganizationAction': {
        category: 'org-role-check',
        reason: 'Inline getCallerOrgRole check resolves the caller own membership',
    },

    'GET src/app/api/organizations/route.ts': {
        category: 'session-scoped',
        reason: 'Returns only the organizations the caller belongs to',
    },
    'GET src/app/api/organizations/[organizationId]/members/route.ts': {
        category: 'session-scoped',
        reason: 'Returns members of an organization the caller belongs to',
    },
    'GET src/app/api/git/accounts/route.ts': {
        category: 'session-scoped',
        reason: 'Returns only the git accounts owned by the caller',
    },
    'GET src/app/api/git/oauth/connect/route.ts': {
        category: 'session-scoped',
        reason: 'Starts an OAuth flow that links a git account to the caller',
    },
    'GET src/app/api/git/oauth/callback/route.ts': {
        category: 'session-scoped',
        reason: 'Completes the OAuth flow for the caller, state is verified',
    },
};

export const REVIEW_FLAGS = Object.entries(GUARD_EXEMPTIONS)
    .filter(([, exemption]) => exemption.review)
    .map(([id, exemption]) => `${id} — ${exemption.review}`)
    .sort();
