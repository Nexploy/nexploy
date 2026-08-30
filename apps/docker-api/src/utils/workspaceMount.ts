import { hostname } from 'node:os';
import type Docker from 'dockerode';
import { DEPLOYER_WORK_DIR, DEPLOYER_WORK_DIR_SOURCE, DOCKER_API_CONTAINER_NAME } from '@/lib/config';
import { logger } from '@/utils/logger';

export interface WorkspaceMount {
    Type: 'bind' | 'volume';
    Source: string;
    Target: string;
}

function isInside(workDir: string, directory: string) {
    return workDir === directory || workDir.startsWith(`${directory}/`);
}

function mountFromEnvironment(workDir: string): WorkspaceMount | null {
    if (!DEPLOYER_WORK_DIR_SOURCE || !isInside(workDir, DEPLOYER_WORK_DIR)) return null;

    return {
        Type: DEPLOYER_WORK_DIR_SOURCE.startsWith('/') ? 'bind' : 'volume',
        Source: DEPLOYER_WORK_DIR_SOURCE,
        Target: DEPLOYER_WORK_DIR,
    };
}

async function inspectSelf(docker: Docker) {
    const identifiers = [DOCKER_API_CONTAINER_NAME, hostname()].filter(Boolean);

    for (const identifier of identifiers) {
        try {
            return await docker.getContainer(identifier).inspect();
        } catch (error) {
            logger.debug({ error, identifier }, 'Could not inspect the docker-api container under this identifier');
        }
    }

    return null;
}

export async function resolveWorkspaceMount(docker: Docker, workDir: string): Promise<WorkspaceMount> {
    const configured = mountFromEnvironment(workDir);

    if (configured) return configured;

    const self = await inspectSelf(docker);

    if (!self) {
        logger.debug({ workDir }, 'docker-api is not running in a container, binding the workspace path directly');

        return { Type: 'bind', Source: workDir, Target: workDir };
    }

    const candidates = (self.Mounts ?? [])
        .filter((mount) => isInside(workDir, mount.Destination))
        .sort((left, right) => right.Destination.length - left.Destination.length);

    const best = candidates[0];

    if (!best) {
        throw new Error(
            `The workspace ${workDir} is not reachable from the docker-api container. Mount the deployer work directory on it, or set DEPLOYER_WORK_DIR and DEPLOYER_WORK_DIR_SOURCE to describe where it lives on the Docker host.`,
        );
    }

    return best.Type === 'volume' && best.Name
        ? { Type: 'volume', Source: best.Name, Target: best.Destination }
        : { Type: 'bind', Source: best.Source, Target: best.Destination };
}
