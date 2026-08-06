import { docker } from '@/utils/dockerClient';
import { route } from '@/utils/route';
import { Hono } from 'hono';
import { networksStateManager } from '@/managers/list/networksStateManager';
import {
    networkCreateSchema,
    networkDeleteSchema,
    networkIdParamSchema,
    networkPruneSchema,
} from '@workspace/schemas-zod/docker/network/networkAction.schema';
import { stripProtectedLabelEntries } from '@nexploy/shared/protectedLabels';
import { filterNexployNetworks } from '@nexploy/shared/nexployFilter';
import { deleteNetworks, pruneNetworks } from '@/services/networkService';
import { runTrackedTask } from '@/lib/taskRunner';
import { describeNetworks } from '@/utils/taskSubjects';

const app = new Hono();

app.post(
    '/hardRefresh',
    route(async () => {
        return await networksStateManager.hardRefresh();
    }),
);

app.get(
    '/',
    route(async () => {
        return filterNexployNetworks(networksStateManager.getAllNetworks());
    }),
);

app.post(
    '/create',
    route({ json: networkCreateSchema }, async (c) => {
        const {
            name,
            driver,
            options: rawOptions,
            labels: rawLabels,
            configFrom: rawConfigFrom,
            scope,
            internal,
            attachable,
            ingress,
            ...rest
        } = c.req.valid('json');

        const options = rawOptions.length ? Object.fromEntries(rawOptions.map((o) => [o.key, o.value])) : undefined;
        const editableLabels = stripProtectedLabelEntries(rawLabels);
        const labels = editableLabels.length
            ? Object.fromEntries(editableLabels.map((l) => [l.key, l.value]))
            : undefined;
        const configFrom = rawConfigFrom?.network ? { Network: rawConfigFrom.network } : undefined;

        const operatorFields = rest.configOnly
            ? {}
            : { Scope: scope, Internal: internal, Attachable: attachable, Ingress: ingress };

        try {
            const info = (await docker.getNetwork(name).inspect()) as { Id: string };
            return { id: info.Id, name, alreadyExisted: true };
        } catch (err: any) {
            if (err.statusCode !== 404) throw err;
        }

        return runTrackedTask({
            kind: 'network-create',
            subjectName: name,
            run: async () => {
                const network = await docker.createNetwork({
                    ...rest,
                    ...operatorFields,
                    Name: name,
                    Driver: driver,
                    ConfigFrom: configFrom,
                    Options: options,
                    Labels: labels,
                });

                return { id: network.id, name, alreadyExisted: false };
            },
        });
    }),
);

app.get(
    '/:id',
    route({ param: networkIdParamSchema }, async (c) => {
        const { id: networkId } = c.req.valid('param');
        return await docker.getNetwork(networkId).inspect();
    }),
);

app.post(
    '/delete',
    route({ json: networkDeleteSchema }, async (c) => {
        const { networkIds, force } = c.req.valid('json');

        return runTrackedTask({
            kind: 'network-remove',
            subjectName: describeNetworks(networkIds),
            run: () => deleteNetworks(networkIds, force),
        });
    }),
);

app.post(
    '/prune',
    route({ json: networkPruneSchema }, async () => {
        return runTrackedTask({
            kind: 'network-prune',
            subjectName: '',
            run: () => pruneNetworks(),
        });
    }),
);

export default app;
