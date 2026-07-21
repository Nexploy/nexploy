import * as fs from 'fs/promises';
import type Docker from 'dockerode';

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitForFile(filePath: string, timeoutMs: number): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            await wait(1000);
        }
    }

    return false;
}

export async function waitForContainerHealthy(
    docker: Docker,
    containerName: string,
    timeoutMs: number,
): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        try {
            const info = await docker.getContainer(containerName).inspect();
            const status = info.State.Health?.Status;

            if (status === 'healthy') return true;
            if (!status && info.State.Running) return true;
        } catch {
            // Container may be mid-recreation, keep polling until the deadline.
        }

        await wait(2000);
    }

    return false;
}
