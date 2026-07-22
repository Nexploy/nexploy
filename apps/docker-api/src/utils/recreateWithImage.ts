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
        ...info.Config,
        name: info.Name.replace('/', ''),
        Image: newImage,
        HostConfig: info.HostConfig,
        NetworkingConfig: {
            EndpointsConfig: Object.fromEntries(
                Object.entries(info.NetworkSettings.Networks ?? {}).map(([name, network]) => [
                    name,
                    { Aliases: network.Aliases ?? [] },
                ]),
            ),
        },
    });

    await created.start();
    return created;
}
