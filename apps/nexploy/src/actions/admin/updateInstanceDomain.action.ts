'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { instanceDomainSchema } from '@workspace/schemas-zod/admin/instance.schema';
import { kyDocker } from '@/lib/api/kyDocker';
import { setToastServer } from '@/lib/toastServer';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { certificateCoversHost, customCertFilesExist, regenerateCustomCertsConfig } from '@/lib/traefik/customCerts';
import { prisma } from '../../../prisma/prisma';

async function prepareCustomCertificate(certificateId: string, domain: string): Promise<void> {
    const t = await getErrorTranslator();

    const certificate = await prisma.sslCertificate.findUnique({
        where: { id: certificateId },
        select: { id: true, type: true, domain: true },
    });

    if (!certificate) throw new Error(t('sslCertificate.notFound'));
    if (certificate.type !== 'CUSTOM') throw new Error(t('sslCertificate.notCustom'));
    if (!certificateCoversHost(certificate.domain, domain)) throw new Error(t('sslCertificate.domainMismatch'));

    await regenerateCustomCertsConfig();

    if (!(await customCertFilesExist(certificate.id))) throw new Error(t('sslCertificate.filesMissing'));
}

export const updateInstanceDomainAction = authActionServer
    .metadata({ name: 'admin.updateInstanceDomain' })
    .use(requirePermission('traefik', 'manage'))
    .inputSchema(instanceDomainSchema)
    .action(async ({ parsedInput }) => {
        if (parsedInput.mode === 'custom' && parsedInput.certificateId) {
            try {
                await prepareCustomCertificate(parsedInput.certificateId, parsedInput.domain);
            } catch (error) {
                if (error instanceof Error) {
                    await setToastServer({ type: 'error', message: error.message });
                }
                throw error;
            }
        }

        try {
            await kyDocker.post('system/instance-domain', { json: parsedInput, timeout: 10_000 }).json();
        } catch (error) {
            console.warn('Instance domain update request was interrupted by the redeploy:', error);
        }

        await setToastServer({
            type: 'info',
            message: 'Nexploy is restarting with the new domain settings — this takes a few seconds.',
        });
    });
