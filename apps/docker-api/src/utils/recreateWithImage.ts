import type Docker from 'dockerode';

export async function recreateContainerWithImage(
    docker: Docker,
    containerName: string,
    newImage: string,
): Promise<Docker.Container> {
    const container = docker.getContainer(containerName);
    const info = await container.inspect();

    if (info.State.Running) await container.stop();
    await container.remove();

    const created = await docker.createContainer({
        name: info.Name.replace('/', ''),
        Image: newImage,
        Hostname: info.Config.Hostname,
        Env: info.Config.Env,
        Cmd: info.Config.Cmd,
        Entrypoint: info.Config.Entrypoint,
        Volumes: info.Config.Volumes,
        WorkingDir: info.Config.WorkingDir,
        User: info.Config.User,
        Labels: info.Config.Labels,
        ExposedPorts: info.Config.ExposedPorts,
        HostConfig: info.HostConfig,
        NetworkingConfig: {
            EndpointsConfig: Object.fromEntries(
                Object.keys(info.NetworkSettings.Networks ?? {}).map((name) => [name, {}]),
            ),
        },
    });

    await created.start();
    return created;
}
