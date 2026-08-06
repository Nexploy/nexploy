# Permission report

Generated from `src/lib/auth/permissions.ts` and the endpoint inventory.

## Overview

| Measure | Value |
| --- | --- |
| Endpoints discovered | 175 |
| Endpoints with a `requirePermission` guard | 132 |
| Endpoints without a guard (declared exemptions) | 43 |
| Declared permissions | 83 |
| Permissions required by at least one endpoint | 61 |
| Permissions never required | 22 |

## Declared permissions that no endpoint requires

No application endpoint requires these permissions. Either the feature does not exist yet,
or the endpoint that should carry the permission is guarded by a different one.

| Permission | Roles that hold it |
| --- | --- |
| `deployment.rollback` | developer, admin |
| `domain.read` | guest, developer, admin |
| `image.remove` | admin |
| `network.read` | guest, developer, admin, system |
| `network.remove` | admin |
| `volume.read` | guest, developer, admin, system |
| `volume.remove` | admin |
| `gitProvider.read` | developer, admin |
| `gitProvider.update` | admin |
| `backup.create` | admin |
| `backup.restore` | admin |
| `backup.delete` | admin |
| `mcpKey.read` | developer, admin |

### Delegated to Better Auth

No Nexploy endpoint requires these permissions: the Better Auth admin plugin enforces them
itself behind `/api/[...all]`.

Permissions concerned: `user.list`, `user.impersonate`, `user.set-password`, `user.set-email`, `user.get`, `user.update`, `session.list`, `session.revoke`, `session.delete`.

## Permission to endpoint mapping

For each permission: the global roles that hold it, and the endpoints that require it.
Resources tagged "org" are decided by the organization role when the resource belongs to an
organization, and by the global role when it belongs to the host.

### `user`

| Action | guest | developer | admin | system | Endpoints |
| --- | --- | --- | --- | --- | --- |
| `create` | — | — | yes | — | `onCreateUserAction` |
| `list` | — | — | yes | — | **none** |
| `set-role` | — | — | yes | — | `updateUserRole` |
| `ban` | — | — | yes | — | `banUser` |
| `impersonate` | — | — | yes | — | **none** |
| `delete` | — | — | yes | — | `deleteUser` |
| `set-password` | — | — | yes | — | **none** |
| `set-email` | — | — | yes | — | **none** |
| `get` | — | — | yes | — | **none** |
| `update` | — | — | yes | — | **none** |

### `session`

| Action | guest | developer | admin | system | Endpoints |
| --- | --- | --- | --- | --- | --- |
| `list` | — | — | yes | — | **none** |
| `revoke` | — | — | yes | — | **none** |
| `delete` | — | — | yes | — | **none** |

### `repository` — org

| Action | guest | developer | admin | system | org:owner | org:admin | org:member | Endpoints |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `create` | — | yes | yes | — | yes | yes | — | `onRepositoryCreateAction` _(byActiveOrganization)_ |
| `read` | yes | yes | yes | yes | yes | yes | yes | `GET src/app/api/git/branches/route.ts` _(HOST_SCOPED)_<br>`GET src/app/api/git/repositories/route.ts` _(HOST_SCOPED)_<br>`GET src/app/api/network/public-ip/route.ts` _(HOST_SCOPED)_<br>`GET src/app/api/repositories/[repositoryId]/builds/[buildId]/nodes/[nodeId]/logs/route.ts` _(byRepositoryIdParam)_<br>`GET src/app/api/repositories/[repositoryId]/builds/[buildId]/route.ts` _(byRepositoryIdParam)_<br>`GET src/app/api/repositories/[repositoryId]/builds/route.ts` _(byRepositoryIdParam)_<br>`GET src/app/api/repositories/[repositoryId]/route.ts` _(byRepositoryIdParam)_<br>`GET src/app/api/repositories/[repositoryId]/versions/route.ts` _(byRepositoryIdParam)_<br>`GET src/app/api/repositories/[repositoryId]/webhook/route.ts` _(byRepositoryIdParam)_<br>`GET src/app/api/repositories/route.ts` _(HOST_SCOPED)_ |
| `update` | — | yes | yes | — | yes | yes | — | `relinkGitAccountAction` _(byBoundRepositoryId)_<br>`moveRepositoryToOrganizationAction` _(byBoundRepositoryId)_ |
| `delete` | — | yes | yes | — | yes | yes | — | `clearCacheAction` _(byRepositoryId)_<br>`deleteRepositoryAction` _(byRepositoryId)_ |

### `build` — org

| Action | guest | developer | admin | system | org:owner | org:admin | org:member | Endpoints |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `read` | yes | yes | yes | yes | yes | yes | yes | `onGetTokenBuildIdAction` _(byBuildId)_ |
| `run` | — | yes | yes | — | yes | yes | yes | `onStartBuild` _(byRepositoryId)_ |
| `cancel` | — | yes | yes | — | yes | yes | — | `onCancelBuild` _(byBuildId)_ |
| `delete` | — | yes | yes | — | yes | yes | — | `onRemoveBuild` _(byBuildId)_<br>`onDeleteVersion` _(byRepositoryId)_ |

### `deployment` — org

| Action | guest | developer | admin | system | org:owner | org:admin | org:member | Endpoints |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `deploy` | — | yes | yes | — | yes | yes | — | `onDeployComposeVersion` _(byRepositoryId)_<br>`onDeployDockerfileVersion` _(byRepositoryId)_ |
| `rollback` | — | yes | yes | — | yes | yes | — | **none** |

### `pipeline` — org

| Action | guest | developer | admin | system | org:owner | org:admin | org:member | Endpoints |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `read` | yes | yes | yes | — | yes | yes | yes | `GET src/app/api/repositories/[repositoryId]/stages/[stageId]/pipeline/route.ts` _(byRepositoryIdParam)_ |
| `update` | — | yes | yes | — | yes | yes | — | `saveNodeConfigAction` _(byBoundRepositoryId)_<br>`savePipelineAction` _(byRepositoryId)_ |
| `webhook` | — | yes | yes | — | yes | yes | — | `setupWebhookAction` _(byRepositoryId)_<br>`teardownWebhookAction` _(byRepositoryId)_ |

### `envVar` — org

| Action | guest | developer | admin | system | org:owner | org:admin | org:member | Endpoints |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `read` | — | yes | yes | — | yes | yes | yes | `GET src/app/api/repositories/[repositoryId]/stages/[stageId]/env/route.ts` _(byRepositoryIdParam)_ |
| `write` | — | yes | yes | — | yes | yes | — | `deleteEnvVariableAction` _(byRepositoryId)_<br>`onEnvVariableAction` _(byRepositoryId)_ |

### `environment`

| Action | guest | developer | admin | system | Endpoints |
| --- | --- | --- | --- | --- | --- |
| `create` | — | — | yes | — | `createEnvironmentAction` |
| `read` | yes | yes | yes | yes | `GET src/app/api/environments/[id]/route.ts`<br>`GET src/app/api/environments/route.ts` |
| `update` | — | — | yes | — | `setDefaultEnvironmentAction`<br>`updateEnvironmentAction` |
| `delete` | — | — | yes | — | `deleteEnvironmentAction` |

### `stage` — org

| Action | guest | developer | admin | system | org:owner | org:admin | org:member | Endpoints |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `read` | yes | yes | yes | — | yes | yes | yes | `GET src/app/api/repositories/[repositoryId]/stages/route.ts` _(byRepositoryIdParam)_ |
| `manage` | — | yes | yes | — | yes | yes | — | `deleteStageAction` _(byStageEntityId)_<br>`upsertStageAction` _(byRepositoryId)_ |

### `domain` — org

| Action | guest | developer | admin | system | org:owner | org:admin | org:member | Endpoints |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `read` | yes | yes | yes | — | yes | yes | yes | **none** |
| `manage` | — | yes | yes | — | yes | yes | — | `addDomain` _(byDomainContainerName)_<br>`deleteDomain` _(byDomainId)_<br>`editDomain` _(byDomainContainerName)_ |

### `ssl` — org

| Action | guest | developer | admin | system | org:owner | org:admin | org:member | Endpoints |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `read` | — | yes | yes | — | yes | yes | yes | `GET src/app/api/ssl-certificates/route.ts` _(HOST_SCOPED)_ |
| `manage` | — | yes | yes | — | yes | yes | — | `createCustomCert` _(HOST_SCOPED)_<br>`createLetsEncryptCert` _(HOST_SCOPED)_<br>`deleteSslCert` _(HOST_SCOPED)_ |

### `container` — org

| Action | guest | developer | admin | system | org:owner | org:admin | org:member | Endpoints |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `read` | yes | yes | yes | yes | yes | yes | yes | `GET src/app/api/events/multiplexed/route.ts` _(HOST_SCOPED)_<br>`onDockerRefreshAction` _(HOST_SCOPED)_ |
| `manage` | — | yes | yes | — | yes | yes | yes | `onContainerChangeImageAction` _(byContainerIds)_<br>`onContainerCreateAction` _(HOST_SCOPED)_<br>`onContainerMigrateAction` _(byContainerIds)_<br>`onContainerPauseAction` _(byContainerIds)_<br>`onContainerRecreateAction` _(byContainerIds)_<br>`onContainerRenameAction` _(byContainerIds)_<br>`onContainerRestartAction` _(byContainerIds)_<br>`onContainerRestartPolicyAction` _(byContainerIds)_<br>`onContainerStartAction` _(byContainerIds)_<br>`onContainerStopAction` _(byContainerIds)_<br>`onContainerUnpauseAction` _(byContainerIds)_ |
| `remove` | — | yes | yes | — | yes | yes | — | `onContainerRemoveAction` _(byContainerIds)_ |

### `image`

| Action | guest | developer | admin | system | Endpoints |
| --- | --- | --- | --- | --- | --- |
| `read` | yes | yes | yes | yes | `GET src/app/api/docker/images/search/route.ts` |
| `pull` | — | yes | yes | — | `onImagePullAction` |
| `manage` | — | — | yes | — | `onImageAction` |
| `remove` | — | — | yes | — | **none** |

### `network`

| Action | guest | developer | admin | system | Endpoints |
| --- | --- | --- | --- | --- | --- |
| `read` | yes | yes | yes | yes | **none** |
| `manage` | — | — | yes | — | `onNetworkAction`<br>`onNetworkCreateAction` |
| `remove` | — | — | yes | — | **none** |

### `volume`

| Action | guest | developer | admin | system | Endpoints |
| --- | --- | --- | --- | --- | --- |
| `read` | yes | yes | yes | yes | **none** |
| `manage` | — | — | yes | — | `onVolumeAction`<br>`onVolumeCreateAction` |
| `remove` | — | — | yes | — | **none** |

### `swarm`

| Action | guest | developer | admin | system | Endpoints |
| --- | --- | --- | --- | --- | --- |
| `read` | yes | yes | yes | — | `onSwarmRefreshAction` |
| `manage` | — | — | yes | — | `onCreateServiceAction`<br>`onForceUpdateServiceAction`<br>`onInitSwarmAction`<br>`onSwarmJoinAction`<br>`onSwarmLeaveAction`<br>`onSwarmNodeAction`<br>`onRemoveServicesAction`<br>`onScaleServiceAction` |

### `gitProvider`

| Action | guest | developer | admin | system | Endpoints |
| --- | --- | --- | --- | --- | --- |
| `create` | — | — | yes | — | `GET src/app/api/providers/github/setup/route.ts`<br>`saveAzureReposProviderAction`<br>`saveBitbucketProviderAction`<br>`saveGiteaProviderAction`<br>`saveGitLabProviderAction` |
| `read` | — | yes | yes | — | **none** |
| `update` | — | — | yes | — | **none** |
| `delete` | — | — | yes | — | `deleteGitProviderAction` |

### `registry`

| Action | guest | developer | admin | system | Endpoints |
| --- | --- | --- | --- | --- | --- |
| `create` | — | — | yes | — | `createRegistryAction` |
| `read` | — | yes | yes | — | `GET src/app/api/registries/route.ts` |
| `update` | — | — | yes | — | `updateRegistryAction` |
| `delete` | — | — | yes | — | `deleteRegistryAction` |
| `mirror` | — | yes | yes | — | `mirrorImageAction` |

### `dns`

| Action | guest | developer | admin | system | Endpoints |
| --- | --- | --- | --- | --- | --- |
| `read` | — | yes | yes | — | `GET src/app/api/cloudflare/accounts/route.ts`<br>`GET src/app/api/cloudflare/zone/route.ts` |
| `manage` | — | — | yes | — | `connectCloudflareAction`<br>`disconnectCloudflareAction` |

### `cloudBackup`

| Action | guest | developer | admin | system | Endpoints |
| --- | --- | --- | --- | --- | --- |
| `read` | — | yes | yes | — | `GET src/app/api/bucket-storage/accounts/route.ts` |
| `manage` | — | — | yes | — | `addBucketStorageAccountAction`<br>`createBackupScheduleAction`<br>`deleteBucketStorageAccountAction`<br>`deleteBackupScheduleAction`<br>`uploadVolumeToBucketStorageAction` |

### `backup`

| Action | guest | developer | admin | system | Endpoints |
| --- | --- | --- | --- | --- | --- |
| `create` | — | — | yes | — | **none** |
| `read` | — | — | yes | — | `GET src/app/api/backup/schedules/route.ts` |
| `restore` | — | — | yes | — | **none** |
| `delete` | — | — | yes | — | **none** |

### `traefik`

| Action | guest | developer | admin | system | Endpoints |
| --- | --- | --- | --- | --- | --- |
| `read` | — | yes | yes | — | `GET src/app/api/traefik/[...slug]/route.ts`<br>`GET src/app/api/traefik/route.ts` |
| `manage` | — | yes | yes | — | `DELETE src/app/api/traefik/[...slug]/route.ts`<br>`POST src/app/api/traefik/route.ts`<br>`updateInstanceDomainAction`<br>`deleteTraefikFile`<br>`moveTraefikEntry`<br>`saveTraefikFile` |

### `setting`

| Action | guest | developer | admin | system | Endpoints |
| --- | --- | --- | --- | --- | --- |
| `read` | — | yes | yes | — | `GET src/app/api/admin/active-builds/route.ts`<br>`GET src/app/api/admin/version/route.ts` |
| `manage` | — | — | yes | — | `runCleanupAction`<br>`updateCleanupSettingsAction`<br>`triggerUpgradeAction` |

### `activity`

| Action | guest | developer | admin | system | Endpoints |
| --- | --- | --- | --- | --- | --- |
| `read` | — | — | yes | — | `GET src/app/api/admin/activity/route.ts`<br>`GET src/app/api/events/activity/stream/route.ts` |
| `manage` | — | — | yes | — | `purgeActivityLogsAction`<br>`updateActivityRetentionAction` |

### `ai`

| Action | guest | developer | admin | system | Endpoints |
| --- | --- | --- | --- | --- | --- |
| `read` | — | yes | yes | — | `GET src/app/api/ai/models/[provider]/route.ts`<br>`GET src/app/api/ai/providers/route.ts` |
| `chat` | — | yes | yes | — | `POST src/app/api/chat/route.ts` |
| `manage` | — | — | yes | — | `addAiConfigAction`<br>`deleteAiConfigAction`<br>`updateAIChatBehaviorAction`<br>`updateAICustomPromptAction`<br>`updateAIGeneralSettingsAction`<br>`updateAIMcpPermissionsAction` |

### `mcpKey`

| Action | guest | developer | admin | system | Endpoints |
| --- | --- | --- | --- | --- | --- |
| `create` | — | — | yes | — | `createMcpApiKeyAction` |
| `read` | — | yes | yes | — | **none** |
| `delete` | — | — | yes | — | `deleteMcpApiKeyAction` |

### `monitoring`

| Action | guest | developer | admin | system | Endpoints |
| --- | --- | --- | --- | --- | --- |
| `read` | yes | yes | yes | yes | `GET src/app/api/events/monitoring/stream/route.ts`<br>`GET src/app/api/system/disk-usage/route.ts` |

## Endpoints without a guard

| Endpoint | Category | Reason |
| --- | --- | --- |
| `DELETE src/app/api/mcp/route.ts` | framework | Better Auth MCP handler; OAuth bearer tokens are verified by the plugin |
| `GET src/app/api/[...all]/route.ts` | framework | Better Auth catch-all handler; it owns its own authentication |
| `GET src/app/api/git/accounts/route.ts` | session-scoped | Returns only the git accounts owned by the caller |
| `GET src/app/api/git/oauth/callback/route.ts` | session-scoped | Completes the OAuth flow for the caller, state is verified |
| `GET src/app/api/git/oauth/connect/route.ts` | session-scoped | Starts an OAuth flow that links a git account to the caller |
| `GET src/app/api/inngest/route.ts` | framework | Inngest serve handler, authenticated by the Inngest signing key |
| `GET src/app/api/internal/docker-api-key/route.ts` | internal-api-key | Service-to-service endpoint for docker-api |
| `GET src/app/api/internal/repository-organizations/route.ts` | internal-api-key | Service-to-service endpoint for docker-api |
| `GET src/app/api/mcp/route.ts` | framework | Better Auth MCP handler; OAuth bearer tokens are verified by the plugin |
| `GET src/app/api/organizations/[organizationId]/members/route.ts` | session-scoped | Returns members of an organization the caller belongs to |
| `GET src/app/api/organizations/route.ts` | session-scoped | Returns only the organizations the caller belongs to |
| `POST src/app/api/[...all]/route.ts` | framework | Better Auth catch-all handler; it owns its own authentication |
| `POST src/app/api/inngest/route.ts` | framework | Inngest serve handler, authenticated by the Inngest signing key |
| `POST src/app/api/internal/verify-api-key/route.ts` | internal-api-key | Service-to-service endpoint used by docker-api to verify Nexploy API keys |
| `POST src/app/api/internal/versions/sync-delete/route.ts` | internal-api-key | Service-to-service endpoint for docker-api, guarded by internalApiAuth |
| `POST src/app/api/internal/volumes/sync-delete/route.ts` | internal-api-key | Service-to-service endpoint for docker-api, guarded by internalApiAuth |
| `POST src/app/api/mcp/route.ts` | framework | Better Auth MCP handler; OAuth bearer tokens are verified by the plugin |
| `POST src/app/api/webhooks/azure-repos/route.ts` | public | Git provider webhook, authenticated by its shared secret token |
| `POST src/app/api/webhooks/bitbucket/route.ts` | public | Git provider webhook, authenticated by its shared secret token |
| `POST src/app/api/webhooks/gitea/route.ts` | public | Git provider webhook, authenticated by its HMAC signature |
| `POST src/app/api/webhooks/github/route.ts` | public | Git provider webhook, authenticated by its HMAC signature, not by a user session |
| `POST src/app/api/webhooks/gitlab/route.ts` | public | Git provider webhook, authenticated by its shared secret token |
| `PUT src/app/api/inngest/route.ts` | framework | Inngest serve handler, authenticated by the Inngest signing key |
| `src/actions/auth/changeUsername.action.ts#onChangeUsernameAction` | delegated-auth | Renames the caller account through Better Auth, which rejects the call without a session |
| `src/actions/auth/setup.action.ts#onSetupAction` | public | First-run setup creates the initial admin before any session exists |
| `src/actions/auth/signIn.action.ts#onSignInAction` | public | Sign-in must run without a session |
| `src/actions/auth/twoFactorAuthDisable.action.ts#onTwoFactorAuthDisableAction` | self-service | Acts on the caller own two-factor settings |
| `src/actions/auth/twoFactorAuthEnable.action.ts#onTwoFactorAuthEnableAction` | self-service | Acts on the caller own two-factor settings |
| `src/actions/auth/twoFactorAuthUseBackupCode.action.ts#twoFactorAuthUseBackupCodeAction` | public | Backup code is verified between sign-in and session creation |
| `src/actions/auth/twoFactorAuthVerifCode.action.ts#twoFactorAuthVerifCodeAction` | public | Second factor is verified between sign-in and session creation |
| `src/actions/git/disconnectGitAccount.action.ts#disconnectGitAccountAction` | self-service | Disconnects a git account owned by the caller |
| `src/actions/organization/acceptInvitation.action.ts#acceptInvitationAction` | session-scoped | The invitation is resolved from the caller email |
| `src/actions/organization/cancelInvitation.action.ts#cancelInvitationAction` | org-role-check | Inline getCallerOrgRole check requires owner or admin in the target organization |
| `src/actions/organization/createOrganization.action.ts#createOrganizationAction` | session-scoped | Better Auth allowUserToCreateOrganization restricts creation to developer and admin |
| `src/actions/organization/deleteOrganization.action.ts#deleteOrganizationAction` | org-role-check | Inline getCallerOrgRole check requires owner in the target organization |
| `src/actions/organization/inviteMember.action.ts#inviteMemberAction` | org-role-check | Inline getCallerOrgRole check requires owner or admin in the target organization |
| `src/actions/organization/leaveOrganization.action.ts#leaveOrganizationAction` | org-role-check | Inline getCallerOrgRole check resolves the caller own membership |
| `src/actions/organization/rejectInvitation.action.ts#rejectInvitationAction` | session-scoped | The invitation is resolved from the caller email |
| `src/actions/organization/removeMember.action.ts#removeMemberAction` | org-role-check | Inline getCallerOrgRole check requires owner or admin in the target organization |
| `src/actions/organization/setActiveOrganization.action.ts#setActiveOrganizationAction` | session-scoped | Better Auth verifies the caller membership before switching the active organization |
| `src/actions/organization/updateMemberRole.action.ts#updateMemberRoleAction` | org-role-check | Inline getCallerOrgRole check requires owner or admin in the target organization |
| `src/actions/organization/updateOrganization.action.ts#updateOrganizationAction` | org-role-check | Inline getCallerOrgRole check requires owner or admin in the target organization |
| `src/actions/tasks/cancelTask.action.ts#onTaskCancelAction` | self-service | requireManageableTask resolves the task owner and rejects other callers |

## Worth tightening

| Endpoint | Note |
| --- | --- |
| `src/actions/auth/changeUsername.action.ts#onChangeUsernameAction` | Uses actionServer instead of authActionServer, so it skips the banned-account check |
