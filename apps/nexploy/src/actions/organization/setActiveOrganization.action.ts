'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { setToastServer } from '@/lib/toastServer';
import { z } from 'zod';
import { getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';

const setActiveOrganizationSchema = z.object({
    organizationId: z.string().nullable(),
});

export const setActiveOrganizationAction = authActionServer
    .inputSchema(setActiveOrganizationSchema)
    .action(async ({ parsedInput }) => {
        const t = await getTranslations('organization');

        try {
            const organization = await auth.api.setActiveOrganization({
                body: { organizationId: parsedInput.organizationId },
                headers: await headers(),
            });

            revalidatePath('/', 'layout');

            return organization;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('errors.setActiveFailed');
            await setToastServer({ type: 'error', message });
            throw error;
        }
    });
