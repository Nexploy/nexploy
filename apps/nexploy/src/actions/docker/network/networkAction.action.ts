'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { networkActionsSchema } from '@workspace/schemas-zod/docker/network/networkAction.schema';
import { isNexployInfrastructureNetworkName } from '@workspace/shared/nexployFilter';
import { HTTPError } from 'ky';

export const onNetworkAction = authActionServer
    .inputSchema(networkActionsSchema)
    .action(async ({ parsedInput: { action, networkIds } }) => {
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
            return await kyDocker.post(`networks/${action}`, { json: networkIds }).json();
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
