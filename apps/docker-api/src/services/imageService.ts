import { docker } from '@/utils/dockerClient';
import { imagesStateManager } from '@/managers/imagesStateManager';
import { ImageDeleteResponse, ImageDeleteResult } from '@workspace/typescript-interface/docker/docker.image';

export async function deleteImages(
    imageIds: string[],
    force: boolean,
): Promise<ImageDeleteResponse> {
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

export async function pullImage(
    imageName: string,
    auth?: { username: string; password: string; serveraddress?: string },
): Promise<{ imageName: string; imageId: string }> {
    await new Promise((resolve, reject) => {
        const options: Record<string, unknown> = {};
        if (auth) options.authconfig = auth;
        (docker.pull as any)(imageName, options, (err: any, stream: NodeJS.ReadableStream) => {
            if (err) return reject(err);
            docker.modem.followProgress(stream, (error: any, output: any) => {
                if (error) return reject(error);
                resolve(output);
            });
        });
    });

    const found = imagesStateManager.getByName(imageName);
    if (!found) throw new Error(`Image ${imageName} not found after pull`);
    return { imageName, imageId: found.fullId };
}

export async function mirrorImage(
    sourceImage: string,
    sourceAuth: Record<string, unknown> | undefined,
    targetName: string,
    targetAuth: Record<string, unknown>,
): Promise<{ success: true; targetName: string }> {
    const sourceExistedBefore = !!imagesStateManager.getByName(sourceImage);

    await new Promise((resolve, reject) => {
        const pullOptions: Record<string, unknown> = {};
        if (sourceAuth) pullOptions.authconfig = sourceAuth;
        (docker.pull as any)(sourceImage, pullOptions, (err: any, stream: any) => {
            if (err) return reject(err);
            docker.modem.followProgress(stream, (error: any, output: any) => {
                if (error) return reject(error);
                resolve(output);
            });
        });
    });

    const lastColon = targetName.lastIndexOf(':');
    const targetRepo = lastColon !== -1 ? targetName.slice(0, lastColon) : targetName;
    const targetTag = lastColon !== -1 ? targetName.slice(lastColon + 1) : 'latest';
    await new Promise((resolve, reject) => {
        docker.getImage(sourceImage).tag({ repo: targetRepo, tag: targetTag }, (err: any) => {
            if (err) return reject(err);
            resolve(null);
        });
    });

    await new Promise((resolve, reject) => {
        const taggedImage = docker.getImage(targetName);
        (taggedImage.push as any)({ authconfig: targetAuth }, (err: any, stream: any) => {
            if (err) return reject(err);
            docker.modem.followProgress(
                stream,
                (error: any, output: any) => {
                    if (error) return reject(error);
                    resolve(output);
                },
                (event: any) => {
                    if (event.error) reject(new Error(event.error));
                },
            );
        });
    });

    try {
        await docker.getImage(targetName).remove();
    } catch {}
    if (!sourceExistedBefore) {
        try {
            await docker.getImage(sourceImage).remove();
        } catch {}
    }

    return { success: true, targetName };
}
