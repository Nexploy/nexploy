import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
    createServiceFormSchema,
    removeServicesSchema,
    scaleServiceSchema,
} from '@workspace/schemas-zod/docker/swarm/serviceAction.schema';
import { swarmNodeActionSchema } from '@workspace/schemas-zod/docker/swarm/nodeAction.schema';
import { kyDocker } from '@/lib/api/kyDocker';
import { fail, guard, ok } from '../helpers';
import { ToolContext, ToolGroup } from '../types';

export const swarmGroup: ToolGroup = {
    name: 'swarm',

    register(server: McpServer, ctx: ToolContext) {
        if (ctx.allowSwarmOperations === false) return;

        server.registerTool(
            'listSwarmNodes',
            { description: 'List all swarm nodes with their role (manager/worker), availability, and state.' },
            async () => {
                const g = guard(ctx, 'docker', 'read');
                if (g) return g;
                try {
                    const nodes = await kyDocker.get('swarm/nodes').json<any[]>();
                    const data = nodes.map((n) => ({
                        id: n.id?.slice(0, 12),
                        hostname: n.hostname,
                        role: n.role,
                        availability: n.availability,
                        state: n.state,
                        address: n.address,
                        isLeader: n.managerStatus?.leader ?? false,
                        engineVersion: n.engineVersion,
                    }));
                    return ok(JSON.stringify({ count: data.length, data }));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'listSwarmServices',
            { description: 'List all swarm services with their replica count and running status.' },
            async () => {
                const g = guard(ctx, 'docker', 'read');
                if (g) return g;
                try {
                    const services = await kyDocker.get('swarm/services').json<any[]>();
                    const data = services.map((s) => ({
                        id: s.id?.slice(0, 12),
                        name: s.name,
                        image: s.image,
                        mode: s.mode,
                        replicas: s.replicas,
                        runningReplicas: s.runningReplicas,
                        ports: s.ports,
                    }));
                    return ok(JSON.stringify({ count: data.length, data }));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'initSwarm',
            {
                description: 'Initialize a Docker Swarm on this node.',
                inputSchema: z.object({
                    advertiseAddr: z.string().optional().describe('Address advertised to other swarm members'),
                    listenAddr: z.string().optional().default('0.0.0.0:2377'),
                }).shape,
            },
            async (params) => {
                const g = guard(ctx, 'docker', 'manage');
                if (g) return g;
                try {
                    await kyDocker.post('swarm/init', { json: params }).json();
                    return ok('Swarm initialized successfully');
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'leaveSwarm',
            {
                description: 'Leave the Docker Swarm.',
                inputSchema: z.object({
                    force: z.boolean().optional().default(false).describe('Force leave even if this is the last manager'),
                }).shape,
            },
            async ({ force }) => {
                const g = guard(ctx, 'docker', 'manage');
                if (g) return g;
                try {
                    await kyDocker.post('swarm/leave', { json: { force } }).json();
                    return ok('Left the swarm successfully');
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'swarmNodeAction',
            {
                description: 'Perform an action on a swarm node: promote, demote, drain, activate, pause, or remove.',
                inputSchema: swarmNodeActionSchema.shape,
            },
            async (params) => {
                const g = guard(ctx, 'docker', 'manage');
                if (g) return g;
                try {
                    await kyDocker.post(`swarm/node/${params.nodeId}/${params.action}`, { json: params }).json();
                    return ok(`Node "${params.nodeId}" — ${params.action} completed`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'createSwarmService',
            {
                description: 'Create a new Docker Swarm service.',
                inputSchema: createServiceFormSchema.shape,
            },
            async (params) => {
                const g = guard(ctx, 'docker', 'manage');
                if (g) return g;
                try {
                    const result = await kyDocker.post('swarm/service', { json: params }).json<any>();
                    return ok(`Service "${params.name}" created (ID: ${result.id?.slice(0, 12) ?? result.id})`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'scaleSwarmService',
            {
                description: 'Scale a swarm service by changing its number of replicas.',
                inputSchema: z.object({
                    id: z.string().describe('Service ID or name'),
                    replicas: scaleServiceSchema.shape.replicas,
                }).shape,
            },
            async ({ id, replicas }) => {
                const g = guard(ctx, 'docker', 'manage');
                if (g) return g;
                try {
                    await kyDocker.post(`swarm/service/${id}/scale`, { json: { replicas } }).json();
                    return ok(`Service "${id}" scaled to ${replicas} replica(s)`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'removeSwarmServices',
            {
                description: 'Remove one or more Docker Swarm services.',
                inputSchema: removeServicesSchema.shape,
            },
            async (params) => {
                const g = guard(ctx, 'docker', 'manage');
                if (g) return g;
                try {
                    await kyDocker.delete('swarm/service/remove', { json: params }).json();
                    return ok(`Removed ${params.serviceIds.length} service(s)`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );
    },
};
