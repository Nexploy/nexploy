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
import { NetworkDeleteResponse } from '@workspace/typescript-interface/docker/docker.network';

const skipReasonToKey: Record<string, string> = {
    builtin: 'errors.networkSkipBuiltin',
    compose_stack: 'errors.networkSkipCompose',
    has_containers: 'errors.networkSkipContainers',
    not_found: 'errors.networkSkipNotFound',
};

export const onNetworkAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .use(preventInfrastructureNetworkAction)
    .inputSchema(networkActionsSchema)
    .action(async ({ parsedInput: { action, networkIds, force } }) => {
        try {
            const result = await kyDocker
                .post(`networks/${action}`, { json: { networkIds, force } })
                .json<NetworkDeleteResponse>();

            if (result.skipped?.length) {
                const t = await getTranslations('docker');
                for (const skipped of result.skipped) {
                    const key = skipReasonToKey[skipped.reason];
                    const message = key
                        ? t(key, { count: 1, name: skipped.name })
                        : skipped.reason;
                    await setToastServer({ type: 'error', message });
                }
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
