import { prisma } from '../../../prisma/prisma';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { kyDocker } from '@/lib/api/kyDocker';
import {
    type EnvironmentProtectedAction,
    environmentProtectedActionSchema,
    type EnvironmentProtectionSchemaType,
} from '@workspace/schemas-zod/docker/environment/environmentProtection.schema';

export interface EnvironmentProtectionState {
    id: string;
    name: string;
    isProtected: boolean;
    allowAdminBypass: boolean;
    protectedActions: EnvironmentProtectedAction[];
}

const toProtectedActions = (values: string[]): EnvironmentProtectedAction[] =>
    values.filter(
        (value): value is EnvironmentProtectedAction => environmentProtectedActionSchema.safeParse(value).success,
    );

export async function listEnvironmentProtections(): Promise<EnvironmentProtectionState[]> {
    const t = await getErrorTranslator();
    try {
        const environments = await prisma.environment.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                name: true,
                isProtected: true,
                allowAdminBypass: true,
                protectedActions: true,
            },
        });

        return environments.map((environment) => ({
            ...environment,
            protectedActions: toProtectedActions(environment.protectedActions),
        }));
    } catch {
        throw new Error(t('environment.getUserEnvironmentsFailed'));
    }
}

export async function getEnvironmentProtection(environmentId: string): Promise<EnvironmentProtectionState | null> {
    const environment = await prisma.environment.findUnique({
        where: { id: environmentId },
        select: {
            id: true,
            name: true,
            isProtected: true,
            allowAdminBypass: true,
            protectedActions: true,
        },
    });

    if (!environment) return null;

    return { ...environment, protectedActions: toProtectedActions(environment.protectedActions) };
}

export async function updateEnvironmentProtection(input: EnvironmentProtectionSchemaType) {
    const t = await getErrorTranslator();
    const { environmentId, isProtected, allowAdminBypass, protectedActions } = input;

    const environment = await prisma.environment.findUnique({ where: { id: environmentId } });
    if (!environment) {
        throw new Error(t('environment.notFound'));
    }

    let updated: EnvironmentProtectionState;

    try {
        const row = await prisma.environment.update({
            where: { id: environmentId },
            data: { isProtected, allowAdminBypass, protectedActions },
            select: {
                id: true,
                name: true,
                isProtected: true,
                allowAdminBypass: true,
                protectedActions: true,
            },
        });

        updated = { ...row, protectedActions: toProtectedActions(row.protectedActions) };
    } catch {
        throw new Error(t('environment.protection.updateFailed'));
    }

    try {
        await kyDocker.put(`environments/${environmentId}/protection`, { json: input });
    } catch {
        await prisma.environment.update({
            where: { id: environmentId },
            data: {
                isProtected: environment.isProtected,
                allowAdminBypass: environment.allowAdminBypass,
                protectedActions: environment.protectedActions,
            },
        });

        throw new Error(t('environment.protection.syncFailed'));
    }

    return updated;
}

export function isEnvironmentActionBlocked(
    protection: Pick<EnvironmentProtectionState, 'isProtected' | 'allowAdminBypass' | 'protectedActions'> | null,
    action: EnvironmentProtectedAction,
    role: string,
): boolean {
    if (!protection?.isProtected) return false;
    if (!protection.protectedActions.includes(action)) return false;
    return !(role === 'admin' && protection.allowAdminBypass);
}
