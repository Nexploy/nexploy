'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { setToastServer } from '@/lib/toastServer';
import { networkActionsSchema } from '@workspace/schemas-zod/docker/network/networkAction.schema';
import { isNexployInfrastructureNetworkName } from '@workspace/shared/nexployFilter';
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
    .inputSchema(networkActionsSchema)
    .action(async ({ parsedInput: { action, networkIds, force } }) => {
        try {
            if (networkIds?.length) {
                for (const networkId of networkIds) {
                    const info = await kyDocker
                        .get(`networks/${networkId}`)
                        .json<{ Name: string }>();
                    if (isNexployInfrastructureNetworkName(info.Name)) {
                        throw new Error(`Cannot ${action} infrastructure network "${info.Name}"`);
                    }
                }
            }
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
