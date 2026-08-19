import type Docker from 'dockerode';
import { PortType } from '@workspace/typescript-interface/docker/docker.port';
import { ContainerRecreateForm } from '@workspace/schemas-zod/docker/container/containerRecreate.schema';
import { getCurrentDockerClient, getCurrentEnvironmentId } from '@/lib/dockerContext';
import { StartedTask, TaskContext, runAsTask } from '@/lib/taskRunner';
import { resolveContainersOwner } from '@/lib/taskOwnership';
import { pullWithProgress } from '@/utils/pullProgress';
import { assertSafeBindPath } from '@/utils/hostBindGuard';

const NAMED_VOLUME_REGEX = /\/var\/lib\/docker\/volumes\/([^/]+)\/_data/;

const RECREATE_STEPS = ['pull', 'stop', 'recreate', 'start'];

const NOOP_CONTEXT: Pick<TaskContext, 'step' | 'completeStep' | 'setProgress'> = {
    step: () => {},
    completeStep: () => {},
    setProgress: () => {},
};

export async function recreateContainer(
    docker: Docker,
    { ports, envVars, volumes, networks, containerId, image, pullImage, auth, hostIp }: ContainerRecreateForm,
    { step, completeStep, setProgress }: Pick<TaskContext, 'step' | 'completeStep' | 'setProgress'> = NOOP_CONTEXT,
): Promise<{ id: string }> {
    const container = docker.getContainer(containerId);
    const containerInfo = await container.inspect();

    const targetImage = image?.trim() || containerInfo.Config.Image;
    const imageChanged = targetImage !== containerInfo.Config.Image;

    const mustPull = Boolean(pullImage || imageChanged);

    step('pull');
    if (mustPull) {
        await pullWithProgress(docker, targetImage, auth, setProgress);
    }
    completeStep('pull', mustPull ? 'done' : 'skipped');

    step('stop');
    if (containerInfo.State.Running) await container.stop();
    completeStep('stop', containerInfo.State.Running ? 'done' : 'skipped');

    const exposedPorts = { ...containerInfo.Config.ExposedPorts };
    const portBindings = { ...containerInfo.HostConfig.PortBindings };

    const removePort = (privatePort: number, type: PortType, publicPort: number) => {
        const key = `${privatePort}/${type}`;
        delete exposedPorts[key];
        if (portBindings[key]) {
            portBindings[key] = portBindings[key].filter((b: any) => b.HostPort !== String(publicPort));
            if (portBindings[key].length === 0) delete portBindings[key];
        }
    };

    const addPort = (privatePort: number, type: PortType, publicPort: number) => {
        const key = `${privatePort}/${type}`;
        exposedPorts[key] = {};
        portBindings[key] = portBindings[key] || [];
        portBindings[key].push({ HostPort: String(publicPort), ...(hostIp !== undefined && { HostIp: hostIp }) });
    };

    for (const port of ports) {
        if (port.typeAction === 'delete' || port.typeAction === 'edit') {
            if (port.currentPrivatePort && port.currentType) {
                if (port.currentPublicPort) {
                    removePort(port.currentPrivatePort, port.currentType, port.currentPublicPort);
                } else {
                    const key = `${port.currentPrivatePort}/${port.currentType}`;
                    delete exposedPorts[key];
                    delete portBindings[key];
                }
            }
        }
        if (port.typeAction === 'add' || port.typeAction === 'edit') {
            if (port.privatePort && port.type && port.publicPort) {
                addPort(port.privatePort, port.type, port.publicPort);
            } else if (port.typeAction === 'edit' && port.privatePort && port.type) {
                exposedPorts[`${port.privatePort}/${port.type}`] = {};
            }
        }
    }

    const envMap = new Map(
        (containerInfo.Config.Env || []).map((e) => {
            const [key, ...valueParts] = e.split('=');
            return [key, valueParts.join('=')];
        }),
    );

    for (const envVar of envVars) {
        if (envVar.typeAction === 'delete' && envVar.currentKey) {
            envMap.delete(envVar.currentKey);
        } else if (envVar.typeAction === 'edit') {
            if (envVar.currentKey) envMap.delete(envVar.currentKey);
            if (envVar.key && envVar.value !== undefined) {
                envMap.set(envVar.key, envVar.value);
            }
        } else if (envVar.typeAction === 'add' && envVar.key && envVar.value !== undefined) {
            envMap.set(envVar.key, envVar.value);
        }
    }

    const env = Array.from(envMap.entries()).map(([k, v]) => `${k}=${v}`);

    const bindsSet = new Set(containerInfo.HostConfig.Binds || []);
    const volumesConfig = { ...(containerInfo.Config.Volumes || {}) };

    const getBindString = (hostPath: string, containerPath: string, readOnly: boolean) =>
        `${hostPath}:${containerPath}${readOnly ? ':ro' : ''}`;

    for (const volume of volumes) {
        if (volume.typeAction === 'delete') {
            if (volume.currentHostPath && volume.currentContainerPath) {
                let hostPath = volume.currentHostPath;
                const namedVolumeMatch = hostPath.match(NAMED_VOLUME_REGEX);
                if (namedVolumeMatch) {
                    hostPath = namedVolumeMatch[1];
                }

                const bindWithSuffix = getBindString(
                    hostPath,
                    volume.currentContainerPath,
                    volume.currentReadOnly || false,
                );
                const bindWithoutSuffix = `${hostPath}:${volume.currentContainerPath}`;
                const bindWithRW = `${hostPath}:${volume.currentContainerPath}:rw`;
                const bindWithRO = `${hostPath}:${volume.currentContainerPath}:ro`;

                bindsSet.delete(bindWithSuffix) ||
                    bindsSet.delete(bindWithoutSuffix) ||
                    bindsSet.delete(bindWithRW) ||
                    bindsSet.delete(bindWithRO);

                delete volumesConfig[volume.currentContainerPath];
            }
        }
        if (volume.typeAction === 'add') {
            if (volume.hostPath && volume.containerPath) {
                let hostPath = volume.hostPath;
                const namedVolumeMatch = hostPath.match(NAMED_VOLUME_REGEX);
                if (namedVolumeMatch) {
                    hostPath = namedVolumeMatch[1];
                }

                if (!namedVolumeMatch) {
                    assertSafeBindPath(hostPath);
                }

                bindsSet.add(getBindString(hostPath, volume.containerPath, volume.readOnly || false));
                volumesConfig[volume.containerPath] = {};
            }
        }
    }

    const networksSet = new Set(Object.keys(containerInfo.NetworkSettings.Networks || {}));

    for (const network of networks) {
        if (network.typeAction === 'delete') {
            if (network.currentName) networksSet.delete(network.currentName);
        }
        if (network.typeAction === 'add') {
            if (network.name) networksSet.add(network.name);
        }
    }

    const networksConfig = Object.fromEntries(Array.from(networksSet).map((name) => [name, {}]));

    step('recreate');
    await container.remove();

    if (hostIp !== undefined) {
        for (const key of Object.keys(portBindings)) {
            portBindings[key] = portBindings[key].map((binding: any) => ({ ...binding, HostIp: hostIp }));
        }
    }

    const newContainer = await docker.createContainer({
        name: containerInfo.Name.replace('/', ''),
        Image: targetImage,
        Hostname: containerInfo.Config.Hostname,
        Env: env,
        Cmd: containerInfo.Config.Cmd,
        Entrypoint: containerInfo.Config.Entrypoint,
        Volumes: volumesConfig,
        WorkingDir: containerInfo.Config.WorkingDir,
        User: containerInfo.Config.User,
        Labels: containerInfo.Config.Labels,
        ExposedPorts: exposedPorts,
        HostConfig: {
            ...containerInfo.HostConfig,
            PortBindings: portBindings,
            Binds: Array.from(bindsSet),
        },
        NetworkingConfig: {
            EndpointsConfig: networksConfig,
        },
    });
    completeStep('recreate');

    step('start');
    await newContainer.start();
    completeStep('start');

    return { id: newContainer.id };
}

export async function startContainerRecreate(
    payload: ContainerRecreateForm,
    subjectName: string,
): Promise<StartedTask> {
    const docker = getCurrentDockerClient();

    return runAsTask<{ id: string }>({
        kind: 'container-recreate',
        subjectName,
        stepKeys: RECREATE_STEPS,
        environmentId: getCurrentEnvironmentId(),
        ownerOrganizationId: await resolveContainersOwner([payload.containerId]),
        run: (context) => recreateContainer(docker, payload, context),
        resultHref: (result) => `/docker/containers/${result.id}`,
    });
}
