'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { setToastServer } from '@/lib/toastServer';
import { organizationIdSchema } from '@workspace/schemas-zod/organization/organizationId.schema';
import { getTranslations } from 'next-intl/server';
import { prisma } from '../../../prisma/prisma';
import { getCallerOrgRole } from '@/lib/auth/resolveOrgContext';
import { redirect } from 'next/navigation';

export const deleteOrganizationAction = authActionServer
    .inputSchema(organizationIdSchema)
    .action(async ({ parsedInput, ctx }) => {
        const t = await getTranslations('organization');

        const callerRole = await getCallerOrgRole(ctx.session.user.id, parsedInput.organizationId);
        if (callerRole !== 'owner' && ctx.session.user.role !== 'admin') {
            throw new Error(t('errors.notFound'));
        }

        const repositoryCount = await prisma.repository.count({
            where: { organizationId: parsedInput.organizationId },
        });
        if (repositoryCount > 0) {
            throw new Error(t('errors.hasRepositories'));
        }

        try {
            await auth.api.deleteOrganization({
                body: { organizationId: parsedInput.organizationId },
                headers: await headers(),
            });

            await setToastServer({ type: 'success', message: t('success.deleted') });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('errors.deleteFailed');
            await setToastServer({ type: 'error', message });
            throw error;
        }

        redirect('/organizations');
    });
