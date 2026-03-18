import { prisma } from '@/../prisma/prisma';
import { Version } from '@workspace/typescript-interface/docker/docker.version';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { decrypt } from '@/lib/encryption';
import { getRepositorieWithEnv } from '@/services/repository.service';
import { Image } from '@workspace/typescript-interface/docker/docker.image';
import { ComposeContent } from '@workspace/typescript-interface/docker/docker.compose.build';
import * as yaml from 'yaml';

async function getEnvVariables(repositoryId: string): Promise<{
    envVariables: Record<string, string>;
}> {
    const repository = await getRepositorieWithEnv(repositoryId);

    if (!repository) {
        throw new Error('repository_not_found');
    }

    const envVariables: Record<string, string> = {};
    for (const envVar of repository.envVariables) {
        envVariables[envVar.key] = decrypt(envVar.value);
    }

    return { envVariables };
}

export async function deployDockerfileVersion(
    repositoryId: string,
    imageTag: string,
    environmentId?: string,
): Promise<unknown> {
    const { envVariables } = await getEnvVariables(repositoryId);
    const imageName = `${repositoryId}:${imageTag}`;

    const images = await kyDocker
        .get('images', { searchParams: { name: repositoryId }, environmentId } as KyDockerOptions)
        .json<Image[]>();

    if (!images.some((img) => img.repoTags.includes(imageName))) {
        throw new Error('image_not_found');
    }

    return kyDocker
        .post('pipeline/deploy', {
            json: {
                repositoryId,
                imageName,
                options: { envVars: envVariables },
            },
            environmentId,
        } as KyDockerOptions)
        .json();
}

export async function deployComposeVersion(
    repositoryId: string,
    imageTag: string,
    environmentId?: string,
): Promise<unknown> {
    const { envVariables } = await getEnvVariables(repositoryId);

    const version = await prisma.version.findUnique({
        where: { repositoryId_imageTag: { repositoryId, imageTag } },
    });

    if (!version?.composeConfig) {
        throw new Error('compose_config_not_found');
    }

    const composeYaml = Buffer.from(version.composeConfig, 'base64').toString('utf8');
    const composeContent = yaml.parse(composeYaml) as ComposeContent;
    const builtServices = Object.values(composeContent.services || {}).filter(
        (s) => s.build && s.image,
    );

    if (builtServices.length > 0) {
        const allImages = await kyDocker
            .get('images', { environmentId } as KyDockerOptions)
            .json<Image[]>();
        const missingImages = builtServices.filter(
            (s) => !allImages.some((img) => img.repoTags.includes(s.image!)),
        );

        if (missingImages.length > 0) {
            throw new Error('image_not_found');
        }
    }

    return kyDocker
        .post('pipeline/deploy-compose', {
            json: {
                repositoryId,
                projectName: `nexploy-${repositoryId}`,
                envVars: envVariables,
                composeConfig: version.composeConfig,
                labels: {
                    'nexploy.repositoryId': repositoryId,
                    'nexploy.imageTag': imageTag,
                    'nexploy.buildType': 'NODE_PIPELINE',
                },
            },
            environmentId,
        } as KyDockerOptions)
        .json();
}

export async function getVersionsByRepository(repositoryId: string): Promise<Version[]> {
    try {
        const versions = await prisma.version.findMany({
            where: { repositoryId },
            orderBy: { createdAt: 'desc' },
            include: {
                environment: {
                    select: { id: true, name: true },
                },
            },
        });

        return versions.map((v) => ({
            imageTag: v.imageTag,
            repositoryId: v.repositoryId,
            buildId: v.imageTag,
            versionNumber: v.versionNumber,
            commitHash: v.commitHash ?? undefined,
            commitMessage: v.commitMessage ?? undefined,
            branch: v.branch ?? undefined,
            createdAt: v.createdAt.getTime(),
            imageId: '',
            imageFullName: `${v.repositoryId}:${v.imageTag}`,
            environmentId: v.environment?.id ?? undefined,
            environmentName: v.environment?.name ?? undefined,
            hasComposeConfig: !!v.composeConfig,
        }));
    } catch {
        return [];
    }
}
