'use server';

import {
    authActionServer,
    preventInfrastructureNetworkAction,
    requirePermission,
} from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { setToastServer } from '@/lib/toastServer';
import { networkActionsSchema } from '@workspace/schemas-zod/docker/network/networkAction.schema';
import { HTTPError } from 'ky';
import { getTranslations } from 'next-intl/server';

interface DeleteResponse {
    deleted: string[];
    skipped: { id: string; name: string; reason: string }[];
}

const skipReasonToKey: Record<string, string> = {
    builtin: 'errors.networkSkipBuiltin',
    compose_stack: 'errors.networkSkipCompose',
    has_containers: 'errors.networkSkipContainers',
};

export const onNetworkAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .use(preventInfrastructureNetworkAction)
    .inputSchema(networkActionsSchema)
    .action(async ({ parsedInput: { action, networkIds, force } }) => {
        try {
            const result = await kyDocker
                .post(`networks/${action}`, { json: { networkIds, force } })
                .json<DeleteResponse>();

            if (result.skipped?.length) {
                const t = await getTranslations('docker');
                const messages = result.skipped.map((s) => {
                    const key = skipReasonToKey[s.reason];
                    return key ? t(key, { name: s.name }) : s.reason;
                });
                await setToastServer({
                    type: 'warning',
                    message: messages.join('\n'),
                });
            }

            return result;
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
            throw err;
        }
    });
