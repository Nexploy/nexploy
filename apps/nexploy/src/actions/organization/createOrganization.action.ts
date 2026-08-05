'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { setToastServer } from '@/lib/toastServer';
import { createOrganizationSchema } from '@workspace/schemas-zod/organization/createOrganization.schema';
import { getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import { generateOrganizationSlug } from '@/services/organization.service';

export const createOrganizationAction = authActionServer
    .metadata({ name: 'organization.create' })
    .inputSchema(createOrganizationSchema)
    .action(async ({ parsedInput, ctx }) => {
        const t = await getTranslations('organization');

        if (ctx.session.user.role !== 'developer' && ctx.session.user.role !== 'admin') {
            throw new Error(t('errors.guestCannotCreate'));
        }

        try {
            const organization = await auth.api.createOrganization({
                body: {
                    name: parsedInput.name,
                    slug: generateOrganizationSlug(parsedInput.name),
                },
                headers: await headers(),
            });

            await setToastServer({ type: 'success', message: t('success.created') });
            revalidatePath('/', 'layout');

            return organization;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('errors.createFailed');
            await setToastServer({ type: 'error', message });
            throw error;
        }
    });
