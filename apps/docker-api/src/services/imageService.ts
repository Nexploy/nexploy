import { docker } from '@/utils/dockerClient';
import { getCurrentDockerClient, getCurrentEnvironmentId } from '@/lib/dockerContext';
import { imagesStateManager } from '@/managers/list/imagesStateManager';
import { ImageDeleteResponse, ImageDeleteResult } from '@workspace/typescript-interface/docker/docker.image';
import { StartedTask, runAsTask } from '@/lib/taskRunner';
import { RegistryAuth, pullWithProgress } from '@/utils/pullProgress';

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
