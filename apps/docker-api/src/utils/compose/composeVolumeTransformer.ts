import type { ComposeContent } from '@workspace/typescript-interface/docker/docker.compose.build';
import type {
    BindMountTransformation,
    ComposeVolumeConfig,
    ParsedBindMount,
    VolumeTransformationResult,
} from '@workspace/typescript-interface/docker/docker.compose.volume';
import {
    getBindMountsByService,
    isBindMount,
    parseComposeBindMounts,
    parseVolumeSpec,
} from './composeVolumeParser';
import { logger } from '../logger';

export function transformBindMountsForRemote(
    composeContent: ComposeContent,
    workDir: string,
    projectName: string,
): VolumeTransformationResult {
    const bindMounts = parseComposeBindMounts(composeContent, workDir);
    const transformations: BindMountTransformation[] = [];
    const generatedDockerfiles = new Map<string, string>();
    const volumesToCreate: string[] = [];
    const warnings: string[] = [];

    const mountsByService = getBindMountsByService(bindMounts);

    for (const [serviceName, mounts] of mountsByService) {
        const service = composeContent.services?.[serviceName];
        if (!service) continue;

        const hasBuildSection = !!service.build;

        for (const mount of mounts) {
            const transformation = createTransformation(mount, projectName);

            transformations.push(transformation);

            if (transformation.strategy === 'named_volume' && transformation.volumeName) {
                volumesToCreate.push(transformation.volumeName);
            }

            if (transformation.strategy === 'remove' && transformation.warningMessage) {
                warnings.push(transformation.warningMessage);
            }
        }

        const codeMounts = mounts.filter((m) => m.classification === 'code' && m.exists);
        if (codeMounts.length > 0 && !hasBuildSection) {
            const dockerfile = generateDockerfileForCodeMounts(serviceName, codeMounts, service);
            if (dockerfile) {
                generatedDockerfiles.set(serviceName, dockerfile);
            }
        }
    }

    const modifiedComposeContent = applyTransformations(
        composeContent,
        transformations,
        generatedDockerfiles,
    );

    return {
        transformations,
        modifiedComposeContent,
        generatedDockerfiles,
        volumesToCreate,
        warnings,
    };
}

function createTransformation(
    mount: ParsedBindMount,
    projectName: string,
): BindMountTransformation {
    if (!mount.exists) {
        return {
            serviceName: mount.serviceName,
            originalMount: mount,
            strategy: 'remove',
            warningMessage: `Bind mount path does not exist: ${mount.hostPath} for service ${mount.serviceName}. Removing from compose.`,
        };
    }

    if (mount.classification === 'code') {
        return {
            serviceName: mount.serviceName,
            originalMount: mount,
            strategy: 'copy_to_image',
        };
    }

    const volumeName = generateVolumeName(projectName, mount.serviceName, mount.containerPath);
    return {
        serviceName: mount.serviceName,
        originalMount: mount,
        strategy: 'named_volume',
        volumeName,
    };
}

function generateVolumeName(
    projectName: string,
    serviceName: string,
    containerPath: string,
): string {
    const pathPart = containerPath
        .replace(/^\//, '')
        .replace(/\//g, '_')
        .replace(/[^a-zA-Z0-9_-]/g, '');

    return `${projectName}_${serviceName}_${pathPart}`.substring(0, 63);
}

function generateDockerfileForCodeMounts(
    serviceName: string,
    codeMounts: ParsedBindMount[],
    service: { image?: string; [key: string]: unknown },
): string | null {
    if (!service.image) {
        logger.warn({ serviceName }, 'No base image found for code mount transformation');
        return null;
    }

    const lines = [`FROM ${service.image}`];

    for (const mount of codeMounts) {
        lines.push(`COPY ${mount.hostPath} ${mount.containerPath}`);
    }

    return lines.join('\n');
}

function applyTransformations(
    composeContent: ComposeContent,
    transformations: BindMountTransformation[],
    generatedDockerfiles: Map<string, string>,
): ComposeContent {
    const modified = JSON.parse(JSON.stringify(composeContent)) as ComposeContent;
    const namedVolumes = new Set<string>();

    for (const [serviceName, service] of Object.entries(modified.services || {})) {
        const serviceTransforms = transformations.filter((t) => t.serviceName === serviceName);
        if (serviceTransforms.length === 0) continue;

        const originalVolumes = (service.volumes as (string | Record<string, unknown>)[]) || [];
        const newVolumes: string[] = [];

        for (const vol of originalVolumes) {
            const volumeSpec = vol as string | ComposeVolumeConfig;
            if (!isBindMount(volumeSpec)) {
                newVolumes.push(typeof vol === 'string' ? vol : JSON.stringify(vol));
                continue;
            }

            const parsed = parseVolumeSpec(volumeSpec);
            if (!parsed) {
                newVolumes.push(typeof vol === 'string' ? vol : JSON.stringify(vol));
                continue;
            }

            const transform = serviceTransforms.find(
                (t) =>
                    t.originalMount.hostPath === parsed.hostPath &&
                    t.originalMount.containerPath === parsed.containerPath,
            );

            if (!transform) {
                newVolumes.push(typeof vol === 'string' ? vol : JSON.stringify(vol));
                continue;
            }

            switch (transform.strategy) {
                case 'copy_to_image':
                    break;

                case 'named_volume':
                    if (transform.volumeName) {
                        const volSpec = `${transform.volumeName}:${parsed.containerPath}${parsed.readOnly ? ':ro' : ''}`;
                        newVolumes.push(volSpec);
                        namedVolumes.add(transform.volumeName);
                    }
                    break;

                case 'remove':
                    break;
            }
        }

        service.volumes = newVolumes.length > 0 ? newVolumes : undefined;

        if (generatedDockerfiles.has(serviceName)) {
            service.build = {
                context: '.',
                dockerfile: `.nexploy-${serviceName}.Dockerfile`,
            };
            delete service.image;
        }
    }

    if (namedVolumes.size > 0) {
        modified.volumes = modified.volumes || {};
        for (const volName of namedVolumes) {
            (modified.volumes as Record<string, unknown>)[volName] = {};
        }
    }

    return modified;
}

export function getTransformationSummary(result: VolumeTransformationResult): string[] {
    const lines: string[] = [];

    for (const t of result.transformations) {
        let action: string;
        switch (t.strategy) {
            case 'copy_to_image':
                action = 'COPY into image';
                break;
            case 'named_volume':
                action = `Named volume: ${t.volumeName}`;
                break;
            case 'remove':
                action = 'Removed (path not found)';
                break;
        }
        lines.push(`[${t.serviceName}] ${t.originalMount.hostPath} -> ${action}`);
    }

    return lines;
}
