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
    const tempConfig = {
        name: data.name,
        connectionType: data.connectionType,
        socketPath: data.socketPath,
        host: data.host,
        port: data.port,
        tlsCert: data.tlsCert,
        tlsKey: data.tlsKey,
        tlsCa: data.tlsCa,
        isDefault: false,
    };

    try {
        await kyDocker.post('environments/validate', {
            json: tempConfig,
        });
    } catch (error: any) {
        if (error.response?.status === 400) {
            const errorData = await error.response.json();
            throw new Error(`Invalid Docker configuration: ${errorData.message || error.message}`);
        }
        throw new Error('docker-api is not accessible. Please ensure the service is running.');
    }

    try {
        const environment = await prisma.environment.create({
            data: {
                ...data,
                userId,
                tlsCert: data.tlsCert ? encrypt(data.tlsCert) : null,
                tlsKey: data.tlsKey ? encrypt(data.tlsKey) : null,
                tlsCa: data.tlsCa ? encrypt(data.tlsCa) : null,
            },
            select: {
                id: true,
                name: true,
                connectionType: true,
                socketPath: true,
                host: true,
                port: true,
                tlsCert: true,
                tlsKey: true,
                tlsCa: true,
                description: true,
            },
        });

        const decryptedConfig = {
            tlsCert: environment.tlsCert ? decrypt(environment.tlsCert) : undefined,
            tlsKey: environment.tlsKey ? decrypt(environment.tlsKey) : undefined,
            tlsCa: environment.tlsCa ? decrypt(environment.tlsCa) : undefined,
        };

        await kyDocker.post('environments/register', {
            json: {
                ...environment,
                ...decryptedConfig,
            },
        });
    } catch (error: any) {
        throw new Error(`Failed to register environment with docker-api: ${error.message}`);
    }
}

export async function updateEnvironment(
    id: string,
    data: {
        name?: string;
        connectionType?: 'UNIX_SOCKET' | 'TCP' | 'TCP_TLS';
        socketPath?: string;
        host?: string;
        port?: number;
        tlsCert?: string;
        tlsKey?: string;
        tlsCa?: string;
        description?: string;
        isActive?: boolean;
    },
) {
    const currentEnv = await prisma.environment.findUnique({
        where: { id },
    });

    if (!currentEnv) {
        throw new Error('Environment not found');
    }

    const dockerConfigChanging =
        data.connectionType !== undefined ||
        data.socketPath !== undefined ||
        data.host !== undefined ||
        data.port !== undefined ||
        data.tlsCert !== undefined ||
        data.tlsKey !== undefined ||
        data.tlsCa !== undefined;

    if (dockerConfigChanging) {
        const validationConfig = {
            id,
            name: data.name ?? currentEnv.name,
            connectionType: data.connectionType ?? currentEnv.connectionType,
            socketPath: data.socketPath ?? currentEnv.socketPath ?? undefined,
            host: data.host ?? currentEnv.host ?? undefined,
            port: data.port ?? currentEnv.port ?? undefined,
            tlsCert: data.tlsCert ?? (currentEnv.tlsCert ? decrypt(currentEnv.tlsCert) : undefined),
            tlsKey: data.tlsKey ?? (currentEnv.tlsKey ? decrypt(currentEnv.tlsKey) : undefined),
            tlsCa: data.tlsCa ?? (currentEnv.tlsCa ? decrypt(currentEnv.tlsCa) : undefined),
            isDefault: currentEnv.isDefault,
        };

        try {
            await kyDocker.post('environments/validate', {
                json: validationConfig,
            });
        } catch (error: any) {
            if (error.response?.status === 400) {
                const errorData = await error.response.json();
                throw new Error(
                    `Invalid Docker configuration: ${errorData.message || error.message}`,
                );
            }
            throw new Error('docker-api is not accessible. Please ensure the service is running.');
        }
    }

    const encryptedData = {
        ...data,
        tlsCert: data.tlsCert ? encrypt(data.tlsCert) : undefined,
        tlsKey: data.tlsKey ? encrypt(data.tlsKey) : undefined,
        tlsCa: data.tlsCa ? encrypt(data.tlsCa) : undefined,
    };

    let environment: Environment;
    try {
        environment = await prisma.environment.update({
            where: { id },
            data: encryptedData,
        });
    } catch (error: unknown) {
        throw new Error('Failed to update environment in database');
    }

    if (dockerConfigChanging) {
        try {
            const decryptedConfig = {
                id: environment.id,
                name: environment.name,
                connectionType: environment.connectionType,
                socketPath: environment.socketPath || undefined,
                host: environment.host || undefined,
                port: environment.port || undefined,
                tlsCert: environment.tlsCert ? decrypt(environment.tlsCert) : undefined,
                tlsKey: environment.tlsKey ? decrypt(environment.tlsKey) : undefined,
                tlsCa: environment.tlsCa ? decrypt(environment.tlsCa) : undefined,
                isDefault: environment.isDefault,
            };

            await kyDocker.patch(`environments/${id}`, {
                json: decryptedConfig,
            });
        } catch (error: any) {
            await prisma.environment.update({
                where: { id },
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

    if (environment.isDefault) {
        throw new Error('Cannot delete default environment');
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
        console.warn(`Failed to unregister environment from docker-api: ${error.message}`);
    }
}
