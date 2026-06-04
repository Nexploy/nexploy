import { ContainerInspectInfo } from 'dockerode';
import {
    Container,
    ContainerEvent,
    ContainerState,
    ContainerStateChanges,
    ContainerStateEvents,
} from '@workspace/typescript-interface/docker/docker.container';
import { BaseSingleResourceStateManager } from '@/lib/base/BaseSingleResourceStateManager';
import { ContainerPorts, PortType } from '@workspace/typescript-interface/docker/docker.port';

const CONTAINER_STATE_CHANGE_EVENTS = new Set<ContainerStateEvents>([
    'start',
    'die',
    'stop',
    'pause',
    'unpause',
    'restart',
    'kill',
    'create',
    'destroy',
    'health_status',
    'rename',
]);

export class ContainerStateManager extends BaseSingleResourceStateManager<Container> {
    constructor(containerId: string, environmentId: string) {
        super({
            resourceType: 'Container',
            resourceId: containerId,
            environmentId,
            pollIntervalMs: 5000,
            maxReconnectAttempts: 5,
            maxListeners: 50,
        });
    }

    async fetchResourceState(): Promise<Container> {
        const container = this.docker.getContainer(this.resourceId);
        const info = await container.inspect();
        return this.parseContainerInspect(info);
    }

    getEventFilters(): Record<string, string[]> {
        return {
            type: ['container'],
            container: [this.resourceId],
        };
    }

    shouldHandleEvent(action: string): boolean {
        return CONTAINER_STATE_CHANGE_EVENTS.has(action as ContainerStateEvents);
    }

    isDestroyAction(action: string): boolean {
        return action === 'destroy';
    }

    hasStateChanged(oldState: Container, newState: Container): boolean {
        return (
            oldState.name !== newState.name ||
            oldState.state !== newState.state ||
            oldState.status !== newState.status ||
            oldState.health !== newState.health ||
            oldState.exitCode !== newState.exitCode ||
            oldState.error !== newState.error ||
            oldState.restartCount !== newState.restartCount ||
            JSON.stringify(oldState.network?.ports) !== JSON.stringify(newState.network?.ports) ||
            JSON.stringify(oldState.mounts) !== JSON.stringify(newState.mounts)
        );
    }

    emitInitialState(state: Container): void {
        this.emit('initial-state', {
            type: 'initial-state',
            containerId: this.resourceId,
            container: state,
            timestamp: Date.now(),
        });
    }

    emitStateChange(newState: Container, oldState: Container): void {
        const event: ContainerEvent = {
            type: 'state-change',
            containerId: this.resourceId,
            container: newState,
            changes: this.getStateChanges(oldState, newState),
            timestamp: Date.now(),
        };
        this.emit('state-change', event);
    }

    emitRemoved(oldState: Container): void {
        const event: ContainerEvent = {
            type: 'removed',
            containerId: this.resourceId,
            oldState,
            timestamp: Date.now(),
        };
        this.emit('removed', event);
    }

    protected getCustomStats(): Record<string, any> {
        return {
            currentState: this.currentState?.state,
            hasState: this.currentState !== null,
        };
    }

    private getStateChanges(oldState: Container, newState: Container): ContainerStateChanges {
        const changes: ContainerStateChanges = {};

        if (oldState.name !== newState.name)
            changes.name = { from: oldState.name, to: newState.name };
        if (oldState.state !== newState.state)
            changes.state = { from: oldState.state, to: newState.state };
        if (oldState.status !== newState.status)
            changes.status = { from: oldState.status, to: newState.status };
        if (oldState.health !== newState.health)
            changes.health = { from: oldState.health?.status, to: newState.health?.status };
        if (oldState.exitCode !== newState.exitCode)
            changes.exitCode = {
                from: oldState.exitCode,
                to: newState.exitCode,
            };
        if (oldState.error !== newState.error)
            changes.error = { from: oldState.error, to: newState.error };
        if (oldState.restartCount !== newState.restartCount)
            changes.restartCount = { from: oldState.restartCount, to: newState.restartCount };
        if (JSON.stringify(oldState.network?.ports) !== JSON.stringify(newState.network?.ports))
            changes.networkPorts = true;
        if (JSON.stringify(oldState.mounts) !== JSON.stringify(newState.mounts))
            changes.mounts = true;

        return changes;
    }

    private parseContainerInspect(container: ContainerInspectInfo): Container {
        const portsMap: ContainerPorts[] = [];
        const networkPorts = container.NetworkSettings.Ports || {};

        for (const [portKey, bindings] of Object.entries(networkPorts)) {
            const [privatePortStr, type = 'tcp'] = portKey.split('/');
            const privatePort = parseInt(privatePortStr, 10);

            if (bindings && bindings.length > 0) {
                for (const binding of bindings) {
                    const publicPort = binding.HostPort
                        ? parseInt(binding.HostPort, 10)
                        : undefined;

                    const exists = portsMap.some(
                        (p) => p.privatePort === privatePort && p.publicPort === publicPort,
                    );

                    if (!exists) {
                        portsMap.push({
                            privatePort,
                            publicPort,
                            hostIps: binding.HostIp ? [binding.HostIp] : [],
                            type: type as PortType,
                        });
                    }
                }
            } else {
                const exists = portsMap.some(
                    (p) => p.privatePort === privatePort && p.publicPort === undefined,
                );

                if (!exists) {
                    portsMap.push({
                        privatePort,
                        publicPort: undefined,
                        hostIps: [],
                        type: type as PortType,
                    });
                }
            }
        }

        const networks = container.NetworkSettings.Networks || {};
        const firstNetwork = Object.values(networks)[0];
        const networkMode = Object.keys(networks)[0] || undefined;

        const mounts = container.Mounts.map((m) => ({
            type: m.Type,
            name: m.Name,
            source: m.Source,
            destination: m.Destination,
            driver: m.Driver,
            mode: m.Mode,
            rw: m.RW,
            propagation: m.Propagation,
        }));

        const health = container.State.Health
            ? {
                  status: container.State.Health.Status,
                  failingStreak: container.State.Health.FailingStreak,
                  logs: container.State.Health.Log.map((l) => ({
                      start: l.Start,
                      end: l.End,
                      exitCode: l.ExitCode,
                      output: l.Output,
                  })),
              }
            : undefined;

        const name = container.Name?.replace(/^\//, '') || 'unknown';

        return {
            id: container.Id,
            name,
            image: container.Config?.Image,
            imageId: container.Image.split(':')[1],
            platform: container.Platform,
            driver: container.Driver,
            createdAt: container.Created,
            status: container.State?.Status || 'unknown',
            state: this.normalizeState(container.State),
            running: container.State.Running,
            paused: container.State.Paused,
            restarting: container.State.Restarting,
            dead: container.State.Dead,
            exitCode: container.State.ExitCode,
            error: container.State.Error,
            startedAt: container.State.StartedAt,
            finishedAt: container.State.FinishedAt,
            restartCount: container.RestartCount,
            health,
            path: container.Path,
            args: container.Args,
            cmd: container.Config.Cmd || [],
            entrypoint: container.Config.Entrypoint,
            workingDir: container.Config.WorkingDir,
            user: container.Config.User,
            env: container.Config.Env || [],
            labels: container.Config.Labels || {},
            appArmorProfile: container.AppArmorProfile,
            mountLabel: container.MountLabel,
            processLabel: container.ProcessLabel,
            network: {
                mode: networkMode,
                ipAddress: firstNetwork?.IPAddress,
                gateway: firstNetwork?.Gateway,
                macAddress: firstNetwork?.MacAddress,
                sandboxId: container.NetworkSettings.SandboxID,
                ports: portsMap,
                networks: Object.fromEntries(
                    Object.entries(networks).map(([name, n]) => [
                        name,
                        {
                            networkId: n.NetworkID,
                            endpointId: n.EndpointID,
                            gateway: n.Gateway,
                            ipAddress: n.IPAddress,
                            ipPrefixLen: n.IPPrefixLen,
                            ipv6Gateway: n.IPv6Gateway,
                            globalIPv6Address: n.GlobalIPv6Address,
                            globalIPv6PrefixLen: n.GlobalIPv6PrefixLen,
                            macAddress: n.MacAddress,
                        },
                    ]),
                ),
            },
            graphDriver: container.GraphDriver
                ? {
                      name: container.GraphDriver.Name,
                      data: {
                          deviceId: container.GraphDriver.Data?.DeviceId,
                          deviceName: container.GraphDriver.Data?.DeviceName,
                          deviceSize: container.GraphDriver.Data?.DeviceSize,
                      },
                  }
                : undefined,
            mounts,
            execIds: container.ExecIDs || [],
            timestamp: Date.now(),
        };
    }

    private normalizeState(dockerState: ContainerInspectInfo['State']): ContainerState {
        const state = dockerState.Status.toLowerCase();
        if (['running', 'paused', 'restarting', 'created', 'dead', 'exited'].includes(state)) {
            return state as ContainerState;
        }
        return 'exited';
    }
}
