import { docker } from '@/utils/dockerClient';

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

    const imageInfo = await docker.getImage(imageName).inspect();
    return { imageName, imageId: imageInfo.Id };
}

export async function mirrorImage(
    sourceImage: string,
    sourceAuth: Record<string, unknown> | undefined,
    targetName: string,
    targetAuth: Record<string, unknown>,
): Promise<{ success: true; targetName: string }> {
    let sourceExistedBefore = false;
    try {
        await docker.getImage(sourceImage).inspect();
        sourceExistedBefore = true;
    } catch {}

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
