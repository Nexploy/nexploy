import { prisma } from '../../prisma/prisma';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as yaml from 'yaml';

const TRAEFIK_SERVICE_DIR = path.join(process.cwd(), '..', '..', 'infra', 'traefik', 'service');
const CERTS_DIR = path.join(TRAEFIK_SERVICE_DIR, 'certs');
const TRAEFIK_CERTS_CONTAINER_PATH =
    process.env.TRAEFIK_CERTS_CONTAINER_PATH ?? '/etc/nexploy/traefik/service/certs';

function parseCertExpiry(certPem: string): Date | null {
    try {
        const cert = new crypto.X509Certificate(certPem);
        return new Date(cert.validTo);
    } catch {
        return null;
    }
}

export async function getAllCertificates() {
    return prisma.sslCertificate.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            type: true,
            domain: true,
            expiresAt: true,
            createdAt: true,
        },
    });
}

export async function createLetsEncryptCertificate(name: string, domain: string, email: string) {
    try {
        return prisma.sslCertificate.create({
            data: { name, type: 'LETS_ENCRYPT', domain, email },
        });
    } catch (error) {
        throw new Error('Failed to create LetsEncrypt certificate');
    }
}

export async function createCustomCertificate(
    name: string,
    domain: string,
    certificate: string,
    privateKey: string,
) {
    try {
        const expiresAt = parseCertExpiry(certificate);

        const cert = await prisma.sslCertificate.create({
            data: { name, type: 'CUSTOM', domain, email: '', expiresAt },
        });

        await fs.mkdir(CERTS_DIR, { recursive: true });
        await fs.writeFile(path.join(CERTS_DIR, `${cert.id}.pem`), certificate, 'utf-8');
        await fs.writeFile(path.join(CERTS_DIR, `${cert.id}.key`), privateKey, 'utf-8');

        await regenerateCertsTlsConfig();

        return cert;
    } catch (error) {
        throw new Error('Failed to create custom certificate');
    }
}

export async function deleteSslCertificate(id: string) {
    const cert = await prisma.sslCertificate.findUnique({ where: { id } });
    if (!cert) return;

    await prisma.sslCertificate.delete({ where: { id } });

    if (cert.type === 'CUSTOM') {
        await fs.unlink(path.join(CERTS_DIR, `${id}.pem`)).catch(() => {});
        await fs.unlink(path.join(CERTS_DIR, `${id}.key`)).catch(() => {});
        await regenerateCertsTlsConfig();
    }
}

async function regenerateCertsTlsConfig(): Promise<void> {
    const customCerts = await prisma.sslCertificate.findMany({
        where: { type: 'CUSTOM' },
        select: { id: true },
    });

    const filePath = path.join(TRAEFIK_SERVICE_DIR, 'nexploy-certs.yml');

    if (customCerts.length === 0) {
        await fs.unlink(filePath).catch(() => {});
        return;
    }

    const config = {
        tls: {
            certificates: customCerts.map((c) => ({
                certFile: `${TRAEFIK_CERTS_CONTAINER_PATH}/${c.id}.pem`,
                keyFile: `${TRAEFIK_CERTS_CONTAINER_PATH}/${c.id}.key`,
            })),
        },
    };

    await fs.mkdir(TRAEFIK_SERVICE_DIR, { recursive: true });
    await fs.writeFile(filePath, yaml.stringify(config), 'utf-8');
}
