import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/typescript-interface/pipeline/pipeline';
import { addSslCertificateConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import {
    createLetsEncryptCertificate,
    createCustomCertificate,
} from '@/services/sslCertificate.service';
import { z } from 'zod';

export class AddSslCertificateExecutor implements INodeExecutor {
    readonly type = 'add-ssl-certificate';
    readonly configSchema = addSslCertificateConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof addSslCertificateConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, buildConfig, logger, abortSignal } = ctx;
        const { repositoryId } = buildConfig;
        const { certType, name, domain, email, agreedToTos, certificate, privateKey } = nodeConfig;

        await logger.info(nodeId, `Adding SSL certificate: ${name} (${certType})`);
        if (abortSignal.aborted) throw new Error('Build cancelled');

        let certificateId: string;

        if (certType === 'LETS_ENCRYPT') {
            if (!email) throw new Error("Email is required for Let's Encrypt certificates");
            if (!agreedToTos) throw new Error("You must agree to Let's Encrypt Terms of Service");

            const cert = await createLetsEncryptCertificate(name, domain, email);
            certificateId = cert.id;
            await logger.info(
                nodeId,
                `Let's Encrypt certificate created — Traefik will obtain the cert when the domain is routed`,
            );
        } else {
            if (!certificate) throw new Error('Certificate PEM is required for custom certificates');
            if (!privateKey) throw new Error('Private key is required for custom certificates');

            const cert = await createCustomCertificate(name, domain, certificate, privateKey);
            certificateId = cert.id;
            await logger.info(nodeId, `Custom certificate created for domain: ${domain}`);
        }

        return { output: { certificateId, domain } };
    }
}

export const addSslCertificateExecutor = new AddSslCertificateExecutor();
