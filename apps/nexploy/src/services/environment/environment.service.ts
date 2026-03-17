import { prisma } from '../../../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import { getUserSession } from '@/services/auth/auth.service';
import { EnvironmentSchemaType } from '@workspace/schemas-zod/docker/environment/environment.schema';
import { Environment } from 'generated/client';
import { kyDocker } from '@/lib/api/kyDocker';

export async function getUserEnvironments() {
    try {
        const session = await getUserSession();

        return prisma.environment.findMany({
            where: {
                OR: [{ userId: session?.user.id }, { userId: null }],
                isActive: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    } catch {
        throw new Error('Failed to get user environments');
    }
}

export async function getActiveEnvironments() {
    try {
        return prisma.environment.findMany({
            where: { isActive: true },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        });
    } catch {
        throw new Error('Failed to get active environments');
    }
}

export async function getDefaultEnvironment() {
    try {
        return prisma.environment.findFirst({
            where: { isDefault: true, isActive: true },
        });
    } catch {
        throw new Error('Failed to get default environment');
    }
}

export async function getEnvironmentById(id: string) {
    try {
        return prisma.environment.findUnique({
            where: { id },
        });
    } catch {
        throw new Error('Failed to get environment');
    }
}

export async function createEnvironment(data: EnvironmentSchemaType, userId: string) {
    try {
        await kyDocker.post('environments/validate', {
            json: data,
        });
    } catch (error: any) {
        throw new Error('This environment is not accessible. Please check the connection.');
    }

    const environment = await prisma.environment.create({
        data: {
            ...data,
            userId,
            tlsCert: data.tlsCert ? encrypt(data.tlsCert) : null,
            tlsKey: data.tlsKey ? encrypt(data.tlsKey) : null,
            tlsCa: data.tlsCa ? encrypt(data.tlsCa) : null,
        },
    });

    try {
        await kyDocker.post('environments/register', {
            json: {
                ...data,
                id: environment.id,
            },
        });
    } catch (error: any) {
        await prisma.environment.delete({ where: { id: environment.id } }).catch(() => {});
        throw new Error(`Failed to register environment with docker-api: ${error.message}`);
    }

    return environment;
}

export async function updateEnvironment(environmentData: EnvironmentSchemaType) {
    const currentEnv = await prisma.environment.findUnique({
        where: { id: environmentData.id },
    });

    if (!currentEnv) {
        throw new Error('Environment not found');
    }

    const dockerConfigChanging =
        environmentData.connectionType !== undefined ||
        environmentData.socketPath !== undefined ||
        environmentData.host !== undefined ||
        environmentData.port !== undefined ||
        environmentData.tlsCert !== undefined ||
        environmentData.tlsKey !== undefined ||
        environmentData.tlsCa !== undefined;

    if (dockerConfigChanging) {
        const validationConfig = {
            id: environmentData.id,
            name: environmentData.name ?? currentEnv.name,
            connectionType: environmentData.connectionType ?? currentEnv.connectionType,
            socketPath: environmentData.socketPath ?? currentEnv.socketPath ?? undefined,
            host: environmentData.host ?? currentEnv.host ?? undefined,
            port: environmentData.port ?? currentEnv.port ?? undefined,
            tlsCert:
                environmentData.tlsCert ??
                (currentEnv.tlsCert ? decrypt(currentEnv.tlsCert) : undefined),
            tlsKey:
                environmentData.tlsKey ??
                (currentEnv.tlsKey ? decrypt(currentEnv.tlsKey) : undefined),
            tlsCa:
                environmentData.tlsCa ?? (currentEnv.tlsCa ? decrypt(currentEnv.tlsCa) : undefined),
            description: environmentData.description ?? currentEnv.description ?? undefined,
        };

        try {
            await kyDocker.post('environments/validate', {
                json: validationConfig,
            });
        } catch (error: any) {
            if (error.response) {
                const errorData = await error.response.json().catch(() => null);
                throw new Error(errorData?.message || error.message);
            }
            throw new Error('docker-api is not accessible. Please ensure the service is running.');
        }
    }

    const encryptedData = {
        ...environmentData,
        tlsCert: environmentData.tlsCert ? encrypt(environmentData.tlsCert) : undefined,
        tlsKey: environmentData.tlsKey ? encrypt(environmentData.tlsKey) : undefined,
        tlsCa: environmentData.tlsCa ? encrypt(environmentData.tlsCa) : undefined,
    };

    let environment: Environment;
    try {
        environment = await prisma.environment.update({
            where: { id: environmentData.id },
            data: encryptedData,
        });
    } catch (error: unknown) {
        throw new Error('Failed to update environment in database');
    }

    if (dockerConfigChanging) {
        try {
            const updatePayload = {
                id: environment.id,
                name: environment.name,
                connectionType: environment.connectionType,
                socketPath: environment.socketPath || undefined,
                host: environment.host || undefined,
                port: environment.port || undefined,
                tlsCert: environment.tlsCert ? decrypt(environment.tlsCert) : undefined,
                tlsKey: environment.tlsKey ? decrypt(environment.tlsKey) : undefined,
                tlsCa: environment.tlsCa ? decrypt(environment.tlsCa) : undefined,
                description: environment.description || undefined,
            };

            await kyDocker.patch(`environments/${environmentData.id}`, {
                json: updatePayload,
            });
        } catch (error: any) {
            await prisma.environment.update({
                where: { id: environmentData.id },
                data: {
                    name: currentEnv.name,
                    connectionType: currentEnv.connectionType,
                    socketPath: currentEnv.socketPath,
                    host: currentEnv.host,
                    port: currentEnv.port,
                    tlsCert: currentEnv.tlsCert,
                    tlsKey: currentEnv.tlsKey,
                    tlsCa: currentEnv.tlsCa,
                    description: currentEnv.description,
                    isActive: currentEnv.isActive,
                },
            });

            throw new Error(`Failed to update environment in docker-api: ${error.message}`);
        }
    }

    return environment;
}

export async function setDefaultEnvironment(id: string) {
    try {
        await prisma.$transaction([
            prisma.environment.updateMany({
                where: { isDefault: true },
                data: { isDefault: false },
            }),
            prisma.environment.update({
                where: { id },
                data: { isDefault: true },
            }),
        ]);
    } catch {
        throw new Error('Failed to set default environment');
    }
}

export async function deleteEnvironment(id: string) {
    const environment = await prisma.environment.findUnique({
        where: { id },
    });

    if (!environment) {
        throw new Error('Environment not found');
    }

    try {
        await prisma.environment.delete({
            where: { id },
        });
    } catch (error) {
        throw new Error('Failed to delete environment from database');
    }

    try {
        await kyDocker.delete(`environments/${id}`);
    } catch (error: any) {
        throw new Error(`Failed to unregister environment from docker-api: ${error.message}`);
    }
}

export type EnvironmentHealthStatus = 'connected' | 'disconnected' | 'unknown';

export async function checkEnvironmentHealth(
    environment: Environment,
): Promise<EnvironmentHealthStatus> {
    try {
        const config = {
            id: environment.id,
            name: environment.name,
            connectionType: environment.connectionType,
            socketPath: environment.socketPath || undefined,
            host: environment.host || undefined,
            port: environment.port || undefined,
            tlsCert: environment.tlsCert ? decrypt(environment.tlsCert) : undefined,
            tlsKey: environment.tlsKey ? decrypt(environment.tlsKey) : undefined,
            tlsCa: environment.tlsCa ? decrypt(environment.tlsCa) : undefined,
            description: environment.description || undefined,
        };

        await kyDocker.post('environments/validate', {
            json: config,
            timeout: 5000,
        });

        return 'connected';
    } catch {
        return 'disconnected';
    }
}
