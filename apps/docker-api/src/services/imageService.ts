import type Docker from 'dockerode';
import { docker } from '@/utils/dockerClient';
import { getCurrentDockerClient, getCurrentEnvironmentId } from '@/lib/dockerContext';
import { imagesStateManager } from '@/managers/list/imagesStateManager';
import { ImageDeleteResponse, ImageDeleteResult } from '@workspace/typescript-interface/docker/docker.image';
import { StartedTask, runAsTask } from '@/lib/taskRunner';
import { RegistryAuth, pullWithProgress, pushWithProgress } from '@/utils/pullProgress';
import type { ImageLoadResponse, ImageUntagResponse } from '@workspace/typescript-interface/docker/docker.image';

export async function deleteImages(imageIds: string[], force: boolean): Promise<ImageDeleteResponse> {
    const results = await Promise.all(
        imageIds.map(async (id): Promise<ImageDeleteResult> => {
            const image = imagesStateManager.getById(id);
            if (!image) {
                return { type: 'skipped', id, name: id, reason: 'not_found' };
            }

            if (!force && image.containersUsed > 0) {
                return { type: 'skipped', id, name: image.repoTags[0] ?? id, reason: 'in_use' };
            }

            await docker.getImage(id).remove({ force });
            return { type: 'deleted', id };
        }),
    );

    const deleted: string[] = [];
    const skipped: { id: string; name: string; reason: string }[] = [];
    for (const result of results) {
        if (result.type === 'deleted') {
            deleted.push(result.id);
        } else if (result.type === 'skipped') {
            skipped.push({ id: result.id, name: result.name, reason: result.reason });
        }
    }

    return { deleted, skipped };
}

export function startImagePull(imageName: string, auth?: RegistryAuth): StartedTask {
    const client = getCurrentDockerClient();
    const environmentId = getCurrentEnvironmentId();

    return runAsTask<{ imageName: string; imageId: string }>({
        kind: 'image-pull',
        subjectName: imageName,
        stepKeys: ['pull'],
        environmentId,
        run: async ({ step, completeStep, setProgress }) => {
            step('pull');
            await pullWithProgress(client, imageName, auth, setProgress);
            completeStep('pull');

            const inspect = await client.getImage(imageName).inspect();
            return { imageName, imageId: inspect.Id };
        },
        resultHref: (result) => `/docker/images/${encodeURIComponent(result.imageId)}`,
    });
}

export function startImagePush(imageName: string, auth?: RegistryAuth): StartedTask {
    const client = getCurrentDockerClient();
    const environmentId = getCurrentEnvironmentId();

    return runAsTask<{ imageName: string }>({
        kind: 'image-push',
        subjectName: imageName,
        stepKeys: ['push'],
        environmentId,
        run: async ({ step, completeStep, setProgress }) => {
            step('push');
            await pushWithProgress(client, imageName, auth, setProgress);
            setProgress(100);
            completeStep('push');

            return { imageName };
        },
    });
}

export function startImageImport(source: string, repo: string, tag: string): StartedTask {
    const client = getCurrentDockerClient();
    const environmentId = getCurrentEnvironmentId();
    const imageName = `${repo}:${tag}`;

    return runAsTask<{ imageName: string; imageId: string }>({
        kind: 'image-import',
        subjectName: imageName,
        stepKeys: ['import'],
        environmentId,
        run: async ({ step, completeStep }) => {
            step('import');

            const stream = await client.createImage(null, { fromSrc: source, repo, tag });
            await followStream(client, stream);

            completeStep('import');

            const inspect = await client.getImage(imageName).inspect();

            return { imageName, imageId: inspect.Id };
        },
        resultHref: (result) => `/docker/images/${encodeURIComponent(result.imageId)}`,
    });
}

export async function untagImages(tags: string[]): Promise<ImageUntagResponse> {
    const untagged: string[] = [];
    const skipped: { tag: string; reason: string }[] = [];

    for (const tag of tags) {
        const image = imagesStateManager.getByName(tag);

        if (!image) {
            skipped.push({ tag, reason: 'not_found' });
            continue;
        }

        if (image.repoTags.length <= 1) {
            skipped.push({ tag, reason: 'last_tag' });
            continue;
        }

        await docker.getImage(tag).remove();
        untagged.push(tag);
    }

    return { untagged, skipped };
}

export async function loadImages(archive: NodeJS.ReadableStream): Promise<ImageLoadResponse> {
    const client = getCurrentDockerClient();
    const stream = await client.loadImage(archive);
    const events = await followStream(client, stream);

    const loaded = events
        .map((event) => /Loaded image(?: ID)?: (.+)/.exec(event.stream ?? '')?.[1]?.trim())
        .filter((name): name is string => !!name);

    return { loaded };
}

export async function saveImages(imageIds: string[]): Promise<NodeJS.ReadableStream> {
    const client = getCurrentDockerClient();
    const [first] = imageIds;

    if (imageIds.length === 1 && first) return client.getImage(first).get();

    const names = imageIds.map((id) => `names=${encodeURIComponent(id)}`).join('&');

    return new Promise<NodeJS.ReadableStream>((resolve, reject) => {
        client.modem.dial(
            {
                path: `/images/get?${names}`,
                method: 'GET',
                isStream: true,
                statusCodes: { 200: true, 500: 'server error' },
            },
            (err: Error | null, data: unknown) => {
                if (err) return reject(err);
                resolve(data as NodeJS.ReadableStream);
            },
        );
    });
}

interface DockerStreamEvent {
    stream?: string;
    error?: string;
}

function followStream(client: Docker, stream: NodeJS.ReadableStream): Promise<DockerStreamEvent[]> {
    return new Promise<DockerStreamEvent[]>((resolve, reject) => {
        client.modem.followProgress(
            stream,
            (err: Error | null, events: DockerStreamEvent[]) => (err ? reject(err) : resolve(events ?? [])),
            (event: DockerStreamEvent) => {
                if (event.error) reject(new Error(event.error));
            },
        );
    });
}

export function startImageMirror(
    sourceImage: string,
    sourceAuth: RegistryAuth | undefined,
    targetName: string,
    targetAuth: Record<string, unknown>,
): StartedTask {
    const client = getCurrentDockerClient();
    const environmentId = getCurrentEnvironmentId();
    const sourceExistedBefore = !!imagesStateManager.getByName(sourceImage);

    const lastColon = targetName.lastIndexOf(':');
    const targetRepo = lastColon !== -1 ? targetName.slice(0, lastColon) : targetName;
    const targetTag = lastColon !== -1 ? targetName.slice(lastColon + 1) : 'latest';

    return runAsTask({
        kind: 'image-mirror',
        subjectName: `${sourceImage} → ${targetName}`,
        stepKeys: ['pull', 'tag', 'push', 'cleanup'],
        environmentId,
        cancellable: false,
        run: async ({ step, completeStep, setProgress, warn }) => {
            step('pull');
            await pullWithProgress(client, sourceImage, sourceAuth, (percent) => setProgress(percent / 2));
            completeStep('pull');

            step('tag');
            await client.getImage(sourceImage).tag({ repo: targetRepo, tag: targetTag });
            completeStep('tag');

            step('push');
            await new Promise<void>((resolve, reject) => {
                (client.getImage(targetName).push as any)(
                    { authconfig: targetAuth },
                    (err: Error | null, stream: NodeJS.ReadableStream) => {
                        if (err) return reject(err);
                        client.modem.followProgress(
                            stream,
                            (progressErr: Error | null) => (progressErr ? reject(progressErr) : resolve()),
                            (event: any) => {
                                if (event.error) reject(new Error(event.error));
                            },
                        );
                    },
                );
            });
            setProgress(100);
            completeStep('push');

            step('cleanup');
            try {
                await client.getImage(targetName).remove();
            } catch (err: any) {
                warn(`Local tag "${targetName}" could not be removed: ${err.message}`);
            }
            if (!sourceExistedBefore) {
                try {
                    await client.getImage(sourceImage).remove();
                } catch (err: any) {
                    warn(`Pulled image "${sourceImage}" could not be removed: ${err.message}`);
                }
            }
            completeStep('cleanup');

            return { success: true as const, targetName };
        },
    });
}
