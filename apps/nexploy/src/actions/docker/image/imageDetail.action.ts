'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { z } from 'zod';
import { ImageDetail, ImageHistoryEntry } from '@workspace/typescript-interface/docker/docker.image';

const imageIdSchema = z.object({
    imageId: z.string().min(1),
});

export const getImageDetail = authActionServer
    .inputSchema(imageIdSchema)
    .action(async ({ parsedInput: { imageId } }) => {
        const data = await kyDocker.get(`images/${imageId}`).json<any>();

        return {
            id: data.Id?.replace('sha256:', '').substring(0, 12) || '',
            fullId: data.Id || '',
            name: data.RepoTags?.map((tag: string) => tag.split(':')[0]) || [],
            tag: data.RepoTags?.map((tag: string) => tag.split(':')[1] || 'latest') || [],
            repoTags: data.RepoTags || [],
            repoDigests: data.RepoDigests || [],
            created: Math.floor(new Date(data.Created).getTime() / 1000),
            size: data.Size || 0,
            virtualSize: data.VirtualSize || data.Size || 0,
            sharedSize: 0,
            labels: data.Config?.Labels || {},
            containersUsed: 0,
            parent: data.Parent || '',
            architecture: data.Architecture || '',
            os: data.Os || '',
            timestamp: Date.now(),
            dockerVersion: data.DockerVersion || '',
            author: data.Author || '',
            comment: data.Comment || '',
            config: {
                hostname: data.Config?.Hostname || '',
                user: data.Config?.User || '',
                env: data.Config?.Env || [],
                cmd: data.Config?.Cmd || null,
                entrypoint: data.Config?.Entrypoint || null,
                workingDir: data.Config?.WorkingDir || '',
                exposedPorts: data.Config?.ExposedPorts || {},
                volumes: data.Config?.Volumes || null,
                labels: data.Config?.Labels || {},
                shell: data.Config?.Shell || null,
                stopSignal: data.Config?.StopSignal || '',
            },
            rootFS: {
                type: data.RootFS?.Type || '',
                layers: data.RootFS?.Layers || [],
            },
            graphDriver: {
                name: data.GraphDriver?.Name || '',
                data: data.GraphDriver?.Data || {},
            },
        } as ImageDetail;
    });

export const getImageHistory = authActionServer
    .inputSchema(imageIdSchema)
    .action(async ({ parsedInput: { imageId } }) => {
        const data = await kyDocker.get(`images/${imageId}/history`).json<any[]>();

        return data.map((entry) => ({
            id: entry.Id || '<missing>',
            created: entry.Created || 0,
            createdBy: entry.CreatedBy || '',
            size: entry.Size || 0,
            comment: entry.Comment || '',
            tags: entry.Tags || null,
        })) as ImageHistoryEntry[];
    });
