import type Docker from 'dockerode';

interface RecreateOverrides {
    aliases?: string[];
    healthcheck?: Docker.HealthConfig;
}

export async function recreateContainerWithImage(
    docker: Docker,
    containerName: string,
    newImage: string,
    overrides: RecreateOverrides = {},
): Promise<Docker.Container> {
    const container = docker.getContainer(containerName);
    const info = await container.inspect();

    if (info.State.Running) await container.stop();
    await container.remove();

    const created = await docker.createContainer({
        ...info.Config,
        name: info.Name.replace('/', ''),
        Image: newImage,
        Healthcheck: overrides.healthcheck ?? info.Config.Healthcheck,
        HostConfig: info.HostConfig,
        NetworkingConfig: {
            EndpointsConfig: Object.fromEntries(
                Object.entries(info.NetworkSettings.Networks ?? {}).map(([name, network]) => [
                    name,
                    {
                        Aliases: Array.from(
                            new Set([...(network.Aliases ?? []), ...(overrides.aliases ?? [])]),
                        ),
                    },
                ]),
            ),
        },
    });

    await created.start();
    return created;
}
