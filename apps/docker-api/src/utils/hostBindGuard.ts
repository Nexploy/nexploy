import { HttpError } from '@workspace/shared/http-error';

const DENIED_HOST_PATHS = [
    '/var/run/docker.sock',
    '/var/lib/docker',
    '/etc',
    '/root',
    '/boot',
    '/proc',
    '/sys',
];

export function assertSafeBindPath(hostPath: string): void {
    if (!hostPath.startsWith('/')) {
        throw new HttpError(`Host bind path must be absolute: "${hostPath}"`, 400);
    }

    if (hostPath.includes('..')) {
        throw new HttpError(`Host bind path must not contain "..": "${hostPath}"`, 400);
    }

    const normalized = hostPath.replace(/\/+$/, '') || '/';

    if (normalized === '/') {
        throw new HttpError('Cannot bind the host root filesystem', 400);
    }

    for (const denied of DENIED_HOST_PATHS) {
        if (normalized === denied || normalized.startsWith(`${denied}/`)) {
            throw new HttpError(`Host path "${hostPath}" is not allowed`, 400);
        }
    }
}
