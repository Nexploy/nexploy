import { docker } from '@/utils/dockerClient';
import { HttpError } from '@nexploy/shared/http-error';
import {
    isNexployInfrastructureContainerName,
    isNexployInfrastructureImageReference,
    isNexployInfrastructureNetworkName,
    isNexployInfrastructureVolumeName,
} from '@nexploy/shared/nexployFilter';

function notFound(resource: string, reference: string): HttpError {
    return new HttpError(`${resource} '${reference}' not found`, 404);
}

function reserved(resource: string, name: string): HttpError {
    return new HttpError(`${resource} name '${name}' is reserved by Nexploy`, 409);
}

export function assertContainerNameAvailable(name: string | undefined): void {
    if (name && isNexployInfrastructureContainerName(name)) {
        throw reserved('Container', name);
    }
}

export function assertNetworkNameAvailable(name: string | undefined): void {
    if (name && isNexployInfrastructureNetworkName(name)) {
        throw reserved('Network', name);
    }
}

export function assertVolumeNameAvailable(name: string | undefined): void {
    if (name && isNexployInfrastructureVolumeName(name)) {
        throw reserved('Volume', name);
    }
}

export function assertImageReferenceAvailable(reference: string | undefined): void {
    if (reference && isNexployInfrastructureImageReference(reference)) {
        throw reserved('Image', reference);
    }
}

export async function isInfrastructureContainer(idOrName: string): Promise<boolean> {
    if (isNexployInfrastructureContainerName(idOrName)) return true;

    try {
        const info = await docker.getContainer(idOrName).inspect();
        return isNexployInfrastructureContainerName(info.Name.replace(/^\//, ''));
    } catch {
        return false;
    }
}

export async function assertContainerAccessible(idOrName: string): Promise<void> {
    if (await isInfrastructureContainer(idOrName)) {
        throw notFound('Container', idOrName);
    }
}

export async function assertContainersAccessible(idsOrNames: string[]): Promise<void> {
    await Promise.all(idsOrNames.map(assertContainerAccessible));
}

export async function isInfrastructureImage(idOrReference: string): Promise<boolean> {
    if (isNexployInfrastructureImageReference(idOrReference)) return true;

    try {
        const info = await docker.getImage(idOrReference).inspect();
        return (info.RepoTags ?? []).some(isNexployInfrastructureImageReference);
    } catch {
        return false;
    }
}

export async function assertImageAccessible(idOrReference: string): Promise<void> {
    if (await isInfrastructureImage(idOrReference)) {
        throw notFound('Image', idOrReference);
    }
}

export async function assertImagesAccessible(idsOrReferences: string[]): Promise<void> {
    await Promise.all(idsOrReferences.map(assertImageAccessible));
}

export async function isInfrastructureNetwork(idOrName: string): Promise<boolean> {
    if (isNexployInfrastructureNetworkName(idOrName)) return true;

    try {
        const info = (await docker.getNetwork(idOrName).inspect()) as { Name?: string };
        return isNexployInfrastructureNetworkName(info.Name ?? '');
    } catch {
        return false;
    }
}

export async function assertNetworkAccessible(idOrName: string): Promise<void> {
    if (await isInfrastructureNetwork(idOrName)) {
        throw notFound('Network', idOrName);
    }
}

export async function assertNetworksAccessible(idsOrNames: string[]): Promise<void> {
    await Promise.all(idsOrNames.map(assertNetworkAccessible));
}
