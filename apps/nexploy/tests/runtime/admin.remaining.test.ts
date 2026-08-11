import { addAiConfigAction } from '@/actions/admin/ai/addAiConfig.action';
import { deleteAiConfigAction } from '@/actions/admin/ai/deleteAiConfig.action';
import { createMcpApiKeyAction } from '@/actions/admin/ai/createMcpApiKey.action';
import { deleteMcpApiKeyAction } from '@/actions/admin/ai/deleteMcpApiKey.action';
import { updateAIGeneralSettingsAction } from '@/actions/admin/ai/updateAiGeneralSettings.action';
import { updateAIChatBehaviorAction } from '@/actions/admin/ai/updateAiChatBehavior.action';
import { updateAICustomPromptAction } from '@/actions/admin/ai/updateAiCustomPrompt.action';
import { updateAIMcpPermissionsAction } from '@/actions/admin/ai/updateAiMcpPermissions.action';
import { runCleanupAction } from '@/actions/admin/cleanup/runCleanup.action';
import { triggerUpgradeAction } from '@/actions/admin/triggerUpgrade.action';
import { updateInstanceDomainAction } from '@/actions/admin/updateInstanceDomain.action';
import { onCreateUserAction } from '@/actions/auth/createUser.action';
import { GET as activeBuilds } from '@/app/api/admin/active-builds/route';
import { GET as monitoringStream } from '@/app/api/events/monitoring/stream/route';
import { GET as activityStream } from '@/app/api/events/activity/stream/route';
import { GET as aiProviders } from '@/app/api/ai/providers/route';
import { GET as aiModels } from '@/app/api/ai/models/[provider]/route';
import { POST as chat } from '@/app/api/chat/route';
import { callRoute, type RouteHandler } from '../setup/invoke';
import { ADMIN_ONLY, DEVELOPER_AND_ABOVE, describePermissionMatrix, EVERY_ROLE } from './permissionMatrix';

const route = (handler: unknown, path: string, options: Record<string, unknown> = {}) =>
    callRoute(handler as RouteHandler, { url: `http://localhost:3022${path}`, ...options });

describePermissionMatrix('AI configuration endpoints', [
    {
        name: 'addAiConfigAction',
        kind: 'action',
        invoke: () => addAiConfigAction({ provider: 'OPENAI', apiKey: 'sk-test' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'deleteAiConfigAction',
        kind: 'action',
        invoke: () => deleteAiConfigAction({ provider: 'OPENAI' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'updateAIGeneralSettingsAction',
        kind: 'action',
        invoke: () => updateAIGeneralSettingsAction({ aiEnabled: true, mcpEnabled: false } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'updateAIChatBehaviorAction',
        kind: 'action',
        invoke: () => updateAIChatBehaviorAction({ requireDestructiveConfirmation: true, maxSteps: 5 } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'updateAICustomPromptAction',
        kind: 'action',
        invoke: () => updateAICustomPromptAction({ customSystemPrompt: 'Be brief.' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'updateAIMcpPermissionsAction',
        kind: 'action',
        invoke: () =>
            updateAIMcpPermissionsAction({
                allowExecInContainer: false,
                allowSwarmOperations: false,
                allowImagesGroup: true,
                allowVolumesGroup: true,
                allowNetworksGroup: true,
                allowComposeGroup: true,
                allowRepositoriesGroup: true,
                allowRegistriesGroup: true,
                allowSslGroup: true,
                allowEnvironmentsGroup: true,
            } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'createMcpApiKeyAction',
        kind: 'action',
        invoke: () => createMcpApiKeyAction({ name: 'assistant' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'deleteMcpApiKeyAction',
        kind: 'action',
        invoke: () => deleteMcpApiKeyAction({ keyId: 'key-1' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'GET /api/ai/providers',
        kind: 'route',
        invoke: () => route(aiProviders, '/api/ai/providers'),
        expected: DEVELOPER_AND_ABOVE,
    },
    {
        name: 'GET /api/ai/models/[provider]',
        kind: 'route',
        invoke: () => route(aiModels, '/api/ai/models/OPENAI', { params: { provider: 'OPENAI' } }),
        expected: DEVELOPER_AND_ABOVE,
    },
    {
        name: 'POST /api/chat',
        kind: 'route',
        invoke: () =>
            route(chat, '/api/chat', {
                method: 'POST',
                body: { messages: [], provider: 'OPENAI', model: 'gpt-4o' },
            }),
        expected: DEVELOPER_AND_ABOVE,
    },
]);

describePermissionMatrix('instance maintenance endpoints', [
    {
        name: 'runCleanupAction',
        kind: 'action',
        invoke: () => runCleanupAction({ target: 'images' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'triggerUpgradeAction',
        kind: 'action',
        invoke: () => triggerUpgradeAction({ version: '1.2.3' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'updateInstanceDomainAction',
        kind: 'action',
        invoke: () => updateInstanceDomainAction({ domain: 'nexploy.test', mode: 'ip' } as never),
        expected: DEVELOPER_AND_ABOVE,
    },
    {
        name: 'onCreateUserAction',
        kind: 'action',
        invoke: () =>
            onCreateUserAction({
                name: 'created-by-tests',
                email: 'created-by-tests@nexploy.test',
                password: 'Password123!',
                confirmPassword: 'Password123!',
                role: 'developer',
            } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'GET /api/admin/active-builds',
        kind: 'route',
        invoke: () => route(activeBuilds, '/api/admin/active-builds'),
        expected: DEVELOPER_AND_ABOVE,
    },
]);

describePermissionMatrix('event stream endpoints', [
    {
        name: 'GET /api/events/monitoring/stream',
        kind: 'route',
        invoke: () => route(monitoringStream, '/api/events/monitoring/stream'),
        expected: EVERY_ROLE,
    },
    {
        name: 'GET /api/events/activity/stream',
        kind: 'route',
        invoke: () => route(activityStream, '/api/events/activity/stream'),
        expected: ADMIN_ONLY,
    },
]);
