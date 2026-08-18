'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { instanceDomainSchema } from '@workspace/schemas-zod/admin/instance.schema';
import { kyDocker } from '@/lib/api/kyDocker';
import { setToastServer } from '@/lib/toastServer';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import {
    certificateHostsCoverHost,
    customCertFilesExist,
    readCustomCertHosts,
    regenerateCustomCertsConfig,
} from '@/lib/traefik/customCerts';
import { recordActivity } from '@/lib/activity/recordActivity';
import { propagateInstanceUrlToWebhooks } from '@/services/webhook/instanceWebhooks.service';
import { prisma } from '../../../prisma/prisma';

export type InstanceDomainResult = { applied: true } | { applied: false; error: string };

async function propagateWebhooks(publicUrl: string): Promise<void> {
    try {
        const summary = await propagateInstanceUrlToWebhooks(publicUrl);

        await recordActivity({
            name: 'admin.propagateInstanceUrl',
            source: 'SERVER_ACTION',
            status: summary.failures.length > 0 || summary.gitHubApp === 'failed' ? 'FAILURE' : 'SUCCESS',
            input: { publicUrl, ...summary },
            errorMessage:
                summary.failures.map((failure) => `${failure.repositoryName}: ${failure.error}`).join(' | ') ||
                summary.gitHubAppError,
        });
    } catch (error) {
        console.error('Failed to propagate the new instance URL to the Git webhooks:', error);
    }
}

async function checkCustomCertificate(certificateId: string, domain: string): Promise<string | null> {
    const t = await getErrorTranslator();

    const certificate = await prisma.sslCertificate.findUnique({
        where: { id: certificateId },
        select: { id: true, type: true, domain: true },
    });

    if (!certificate) return t('sslCertificate.notFound');
    if (certificate.type !== 'CUSTOM') return t('sslCertificate.notCustom');

    await regenerateCustomCertsConfig();

    if (!(await customCertFilesExist(certificate.id))) return t('sslCertificate.filesMissing');

    const parsedHosts = await readCustomCertHosts(certificate.id);
    const coveredHosts = parsedHosts.length > 0 ? parsedHosts : [certificate.domain];

    if (!certificateHostsCoverHost(coveredHosts, domain)) {
        return t('sslCertificate.domainMismatch', { host: domain, domains: coveredHosts.join(', ') });
    }

    return null;
}

export const updateInstanceDomainAction = authActionServer
    .metadata({ name: 'admin.updateInstanceDomain' })
    .use(requirePermission('traefik', 'manage'))
    .inputSchema(instanceDomainSchema)
    .action(async ({ parsedInput }): Promise<InstanceDomainResult> => {
        if (parsedInput.mode === 'custom' && parsedInput.certificateId) {
            const error = await checkCustomCertificate(parsedInput.certificateId, parsedInput.domain);
            if (error) {
                await setToastServer({ type: 'error', message: error });
                return { applied: false, error };
            }
        }

        const publicUrl = `${parsedInput.mode === 'ip' ? 'http' : 'https'}://${parsedInput.domain}`;
        await propagateWebhooks(publicUrl);

        try {
            await kyDocker.post('system/instance-domain', { json: parsedInput, timeout: 10_000 }).json();
        } catch (error) {
            console.warn('Instance domain update request was interrupted by the redeploy:', error);
        }

        await setToastServer({
            type: 'info',
            message: 'Nexploy is restarting with the new domain settings — this takes a few seconds.',
        });

        return { applied: true };
    });
