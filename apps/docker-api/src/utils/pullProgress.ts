import type Docker from 'dockerode';

interface PullProgressEvent {
    id?: string;
    status?: string;
    progressDetail?: { current?: number; total?: number };
}

export type RegistryAuth = { username: string; password: string; serveraddress?: string };

export async function pushWithProgress(
    docker: Docker,
    image: string,
    auth: RegistryAuth | undefined,
    onProgress: (percent: number) => void,
): Promise<void> {
    const layers = new Map<string, { current: number; total: number }>();

    const report = () => {
        let current = 0;
        let total = 0;

        for (const layer of layers.values()) {
            current += layer.current;
            total += layer.total;
        }

        if (total > 0) onProgress((current / total) * 100);
    };

    await new Promise<void>((resolve, reject) => {
        const options: Record<string, unknown> = {};
        if (auth) options.authconfig = auth;

        (docker.getImage(image).push as any)(options, (err: Error | null, stream: NodeJS.ReadableStream) => {
            if (err) return reject(err);

            docker.modem.followProgress(
                stream,
                (progressErr: Error | null) => (progressErr ? reject(progressErr) : resolve()),
                (event: PullProgressEvent & { error?: string }) => {
                    if (event.error) return reject(new Error(event.error));

                    const total = event.progressDetail?.total;
                    if (!event.id || !total) return;

                    layers.set(event.id, { current: event.progressDetail?.current ?? 0, total });
                    report();
                },
            );
        });
    });
}

export async function pullWithProgress(
    docker: Docker,
    image: string,
    auth: RegistryAuth | undefined,
    onProgress: (percent: number) => void,
): Promise<void> {
    const layers = new Map<string, { current: number; total: number }>();

    const report = () => {
        let current = 0;
        let total = 0;

        for (const layer of layers.values()) {
            current += layer.current;
            total += layer.total;
        }

        if (total > 0) onProgress((current / total) * 100);
    };

    await new Promise<void>((resolve, reject) => {
        const options: Record<string, unknown> = {};
        if (auth) options.authconfig = auth;

        (docker.pull as any)(image, options, (err: Error | null, stream: NodeJS.ReadableStream) => {
            if (err) return reject(err);

            docker.modem.followProgress(
                stream,
                (progressErr: Error | null) => (progressErr ? reject(progressErr) : resolve()),
                (event: PullProgressEvent) => {
                    const total = event.progressDetail?.total;
                    if (!event.id || !total) return;

                    layers.set(event.id, { current: event.progressDetail?.current ?? 0, total });
                    report();
                },
            );
        });
    });
}
