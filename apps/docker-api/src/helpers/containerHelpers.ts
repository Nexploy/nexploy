import { docker } from '@/utils/dockerClient';

export async function withContainer(c: any, fn: (container: any, state: any) => Promise<any>) {
    const id = c.req.param('id');
    const container = docker.getContainer(id);
    try {
        const inspectData = await container.inspect();
        return await fn(container, inspectData.State);
    } catch (err: any) {
        throw new Error(err);
    }
}

export async function waitForState(container: any, checkFn: (s: any) => boolean, timeoutMs = 3000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const inspectData = await container.inspect();
        if (checkFn(inspectData.State)) return inspectData.State;
        await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error('Timeout waiting for container state change');
}
