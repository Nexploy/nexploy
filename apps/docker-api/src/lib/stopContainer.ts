import type Docker from 'dockerode';
import { HttpError } from '@nexploy/shared/http-error';

const DEFAULT_STOP_TIMEOUT_SECONDS = 300;
const STOP_POLL_INTERVAL_MS = 500;
const STOP_SETTLE_GRACE_SECONDS = 30;

export function resolveStopTimeoutSeconds(): number {
    const configured = Number(process.env.MIGRATION_STOP_TIMEOUT_SECONDS);
    return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_STOP_TIMEOUT_SECONDS;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function isContainerRunning(container: Docker.Container): Promise<boolean> {
    try {
        const info = await container.inspect();
        return info.State.Running === true;
    } catch (err: any) {
        if (err?.statusCode === 404) return false;
        throw err;
    }
}

export async function stopContainerAndWait(container: Docker.Container, name: string): Promise<void> {
    const timeoutSeconds = resolveStopTimeoutSeconds();

    try {
        await (container.stop as any)({ t: timeoutSeconds });
    } catch (err: any) {
        if (err?.statusCode !== 304) {
            throw new HttpError(`Source container "${name}" could not be stopped: ${err.message}`, 502);
        }
    }

    const deadline = Date.now() + (timeoutSeconds + STOP_SETTLE_GRACE_SECONDS) * 1000;

    while (Date.now() < deadline) {
        if (!(await isContainerRunning(container))) return;
        await sleep(STOP_POLL_INTERVAL_MS);
    }

    throw new HttpError(`Source container "${name}" is still running after the stop timeout.`, 504);
}
