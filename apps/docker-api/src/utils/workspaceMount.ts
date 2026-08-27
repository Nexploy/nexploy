import type Docker from 'dockerode';
import { DOCKER_API_CONTAINER_NAME } from '@/lib/config';
import { logger } from '@/utils/logger';

export interface WorkspaceMount {
    Type: 'bind' | 'volume';
    Source: string;
    Target: string;
}

export async function resolveWorkspaceMount(docker: Docker, workDir: string): Promise<WorkspaceMount> {
    try {
        const self = await docker.getContainer(DOCKER_API_CONTAINER_NAME).inspect();

        const candidates = (self.Mounts ?? [])
            .filter((mount) => workDir === mount.Destination || workDir.startsWith(`${mount.Destination}/`))
            .sort((left, right) => right.Destination.length - left.Destination.length);

        const best = candidates[0];

        if (best) {
            return best.Type === 'volume' && best.Name
                ? { Type: 'volume', Source: best.Name, Target: best.Destination }
                : { Type: 'bind', Source: best.Source, Target: best.Destination };
        }

        logger.warn({ workDir }, 'No matching mount found on the docker-api container, binding the path directly');
    } catch (error) {
        logger.warn({ error, workDir }, 'Could not inspect the docker-api container, binding the path directly');
    }

    return { Type: 'bind', Source: workDir, Target: workDir };
}
