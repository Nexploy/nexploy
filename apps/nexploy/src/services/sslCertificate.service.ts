import { prisma } from '../../prisma/prisma';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import {
    certificateHostsCoverHost,
    CUSTOM_CERTS_DIR,
    getCustomCertPaths,
    parseCertificateHosts,
    regenerateCustomCertsConfig,
} from '@/lib/traefik/customCerts';
import { getInstanceCertificateId } from '@/lib/instance/tlsMode';
import { getInstanceHost } from '@/lib/instance/domain';

const CERTS_DIR = CUSTOM_CERTS_DIR;

function parseCertHostsSafe(certPem: string): string[] {
    try {
        return parseCertificateHosts(certPem);
    } catch {
        return [];
    }
}

function parseCertExpiry(certPem: string): Date | null {
    try {
        const cert = new crypto.X509Certificate(certPem);
        return new Date(cert.validTo);
    } catch {
        return null;
    }
}

async function validateCertKeyPair(certPem: string, privateKeyPem: string): Promise<void> {
    const t = await getErrorTranslator();
    let cert: crypto.X509Certificate;
    try {
        cert = new crypto.X509Certificate(certPem);
    } catch {
        throw new Error(t('sslCertificate.invalidCertificate'));
    }

    let key: crypto.KeyObject;
    try {
        key = crypto.createPrivateKey(privateKeyPem);
    } catch {
        throw new Error(t('sslCertificate.invalidPrivateKey'));
    }

    if (!cert.checkPrivateKey(key)) {
        throw new Error(t('sslCertificate.keyMismatch'));
    }
}

export async function getCertificates() {
    const t = await getErrorTranslator();
    try {
        return await prisma.sslCertificate.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                type: true,
                domain: true,
                coveredDomains: true,
                expiresAt: true,
                createdAt: true,
            },
        });
    } catch (error: unknown) {
        throw new Error(t('sslCertificate.fetchFailed'));
    }
}

export async function createLetsEncryptCertificate(name: string, domain: string, email: string) {
    const t = await getErrorTranslator();
    try {
        return prisma.sslCertificate.create({
            data: { name, type: 'LETS_ENCRYPT', domain, email },
        });
    } catch (error) {
        throw new Error(t('sslCertificate.createLetsEncryptFailed'));
    }
}

export async function createCustomCertificate(name: string, domain: string, certificate: string, privateKey: string) {
    const t = await getErrorTranslator();
    await validateCertKeyPair(certificate, privateKey);

    const expiresAt = parseCertExpiry(certificate);
    const coveredDomains = parseCertHostsSafe(certificate);

    const cert = await prisma.sslCertificate.create({
        data: { name, type: 'CUSTOM', domain, email: '', expiresAt, coveredDomains },
    });

    try {
        await fs.mkdir(CERTS_DIR, { recursive: true });
        await fs.writeFile(path.join(CERTS_DIR, `${cert.id}.pem`), certificate, 'utf-8');
        await fs.writeFile(path.join(CERTS_DIR, `${cert.id}.key`), privateKey, 'utf-8');

        await regenerateCustomCertsConfig();
    } catch (error) {
        await prisma.sslCertificate.delete({ where: { id: cert.id } }).catch(() => {});
        await fs.unlink(path.join(CERTS_DIR, `${cert.id}.pem`)).catch(() => {});
        await fs.unlink(path.join(CERTS_DIR, `${cert.id}.key`)).catch(() => {});
        throw new Error(t('sslCertificate.writeFilesFailed'));
    }

    return cert;
}

export interface UpdateCustomCertificateInput {
    id: string;
    name: string;
    domain: string;
    certificate?: string;
    privateKey?: string;
}

export async function updateCustomCertificate(input: UpdateCustomCertificateInput) {
    const t = await getErrorTranslator();

    const existing = await prisma.sslCertificate.findUnique({
        where: { id: input.id },
        select: { id: true, type: true },
    });
    if (!existing) throw new Error(t('sslCertificate.notFound'));
    if (existing.type !== 'CUSTOM') throw new Error(t('sslCertificate.notEditable'));

    const certificate = input.certificate?.trim();
    const privateKey = input.privateKey?.trim();

    if (!certificate || !privateKey) {
        return prisma.sslCertificate.update({
            where: { id: input.id },
            data: { name: input.name, domain: input.domain },
        });
    }

    await validateCertKeyPair(certificate, privateKey);

    const coveredDomains = parseCertHostsSafe(certificate);

    if (getInstanceCertificateId() === input.id) {
        const instanceHost = getInstanceHost();
        const hosts = coveredDomains.length > 0 ? coveredDomains : [input.domain];
        if (instanceHost && !certificateHostsCoverHost(hosts, instanceHost)) {
            throw new Error(
                t('sslCertificate.instanceHostNotCovered', { host: instanceHost, domains: hosts.join(', ') }),
            );
        }
    }

    const { certFile, keyFile } = getCustomCertPaths(input.id);
    const previousCertificate = await fs.readFile(certFile, 'utf-8').catch(() => null);
    const previousPrivateKey = await fs.readFile(keyFile, 'utf-8').catch(() => null);

    try {
        await fs.mkdir(CERTS_DIR, { recursive: true });
        await fs.writeFile(certFile, certificate, 'utf-8');
        await fs.writeFile(keyFile, privateKey, 'utf-8');
    } catch {
        if (previousCertificate !== null) await fs.writeFile(certFile, previousCertificate, 'utf-8').catch(() => {});
        if (previousPrivateKey !== null) await fs.writeFile(keyFile, previousPrivateKey, 'utf-8').catch(() => {});
        throw new Error(t('sslCertificate.writeFilesFailed'));
    }

    const updated = await prisma.sslCertificate.update({
        where: { id: input.id },
        data: {
            name: input.name,
            domain: input.domain,
            expiresAt: parseCertExpiry(certificate),
            coveredDomains,
        },
    });

    await regenerateCustomCertsConfig();

    return updated;
}

export async function deleteSslCertificate(id: string) {
    const cert = await prisma.sslCertificate.findUnique({ where: { id } });
    if (!cert) return;

    if (getInstanceCertificateId() === id) {
        const t = await getErrorTranslator();
        throw new Error(t('sslCertificate.inUseByInstance'));
    }

    await prisma.sslCertificate.delete({ where: { id } });

    if (cert.type === 'CUSTOM') {
        await fs.unlink(path.join(CERTS_DIR, `${id}.pem`)).catch(() => {});
        await fs.unlink(path.join(CERTS_DIR, `${id}.key`)).catch(() => {});
        await regenerateCustomCertsConfig();
    }
}
