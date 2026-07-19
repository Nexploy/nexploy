import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
    createCustomCertSchema,
    createLetsEncryptCertSchema,
    deleteCertSchema,
} from '@workspace/schemas-zod/repository/sslCertificate.schema';
import {
    createCustomCertificate,
    createLetsEncryptCertificate,
    deleteSslCertificate,
    getCertificates,
} from '@/services/sslCertificate.service';
import { fail, guard, guardDestructive, ok } from '../helpers';
import { ToolContext, ToolGroup } from '../types';

export const sslGroup: ToolGroup = {
    name: 'ssl',

    register(server: McpServer, ctx: ToolContext) {
        if (ctx.allowSslGroup === false) return;

        server.registerTool(
            'listSslCertificates',
            { description: "List all SSL certificates (Let's Encrypt and custom)." },
            async () => {
                const g = guard(ctx, 'repository', 'read');
                if (g) return g;
                try {
                    const certs = await getCertificates();
                    const data = certs.map((c) => ({
                        id: c.id,
                        name: c.name,
                        type: c.type,
                        domain: c.domain,
                        expiresAt: c.expiresAt,
                        createdAt: c.createdAt,
                    }));
                    return ok(JSON.stringify({ count: data.length, data }));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'createLetsEncryptCertificate',
            {
                description: "Issue a Let's Encrypt certificate for a domain.",
                inputSchema: createLetsEncryptCertSchema.shape,
            },
            async ({ name, domain, email }) => {
                const g = guard(ctx, 'repository', 'update');
                if (g) return g;
                try {
                    const cert = await createLetsEncryptCertificate(name, domain, email);
                    return ok(
                        `Certificate "${cert.name}" created for ${cert.domain} (ID: ${cert.id})`,
                    );
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'createCustomCertificate',
            {
                description: 'Add a custom SSL certificate (PEM format).',
                inputSchema: createCustomCertSchema.shape,
            },
            async ({ name, domain, certificate, privateKey }) => {
                const g = guard(ctx, 'repository', 'update');
                if (g) return g;
                try {
                    const cert = await createCustomCertificate(
                        name,
                        domain,
                        certificate,
                        privateKey,
                    );
                    return ok(
                        `Custom certificate "${cert.name}" added for ${cert.domain} (ID: ${cert.id})`,
                    );
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'deleteSslCertificate',
            {
                description: 'Delete an SSL certificate by ID.',
                inputSchema: deleteCertSchema.shape,
            },
            async ({ id }) => {
                const g = guardDestructive(ctx, 'repository', 'update', id);
                if (g) return g;
                try {
                    await deleteSslCertificate(id);
                    return ok(`Certificate deleted`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );
    },
};
