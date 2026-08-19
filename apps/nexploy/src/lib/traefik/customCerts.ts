import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { prisma } from '../../../prisma/prisma';
import { TRAEFIK_SERVICE_DIR } from './paths';

export const CUSTOM_CERTS_DIR = path.join(TRAEFIK_SERVICE_DIR, 'certs');

const TRAEFIK_CERTS_CONTAINER_PATH = process.env.TRAEFIK_CERTS_CONTAINER_PATH ?? '/etc/nexploy/traefik/service/certs';
const CERTS_CONFIG_FILE = path.join(TRAEFIK_SERVICE_DIR, 'nexploy-certs.yml');

export function getCustomCertPaths(certificateId: string): { certFile: string; keyFile: string } {
    return {
        certFile: path.join(CUSTOM_CERTS_DIR, `${certificateId}.pem`),
        keyFile: path.join(CUSTOM_CERTS_DIR, `${certificateId}.key`),
    };
}

export async function customCertFilesExist(certificateId: string): Promise<boolean> {
    const { certFile, keyFile } = getCustomCertPaths(certificateId);
    try {
        await Promise.all([fs.access(certFile), fs.access(keyFile)]);
        return true;
    } catch {
        return false;
    }
}

const PEM_CERTIFICATE_BLOCK = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
const HOSTNAME_PATTERN = /^\*?[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

function isHostname(value: string): boolean {
    return HOSTNAME_PATTERN.test(value.startsWith('*.') ? value.slice(2) : value);
}

function hostsFromCertificate(certificate: crypto.X509Certificate): string[] {
    const subjectAltNames = (certificate.subjectAltName ?? '')
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.startsWith('DNS:') || entry.startsWith('IP Address:'))
        .map((entry) => entry.slice(entry.indexOf(':') + 1).trim())
        .filter(Boolean);

    if (subjectAltNames.length > 0) return subjectAltNames;

    const commonName = /(?:^|\n)CN=(.+)$/m
        .exec(certificate.subject ?? '')?.[1]
        ?.replace(/\\,/g, ',')
        .trim();

    return commonName && isHostname(commonName) ? [commonName] : [];
}

export function parseCertificateHosts(certificatePem: string): string[] {
    const blocks = certificatePem.match(PEM_CERTIFICATE_BLOCK) ?? [certificatePem];

    for (const block of blocks) {
        try {
            const hosts = hostsFromCertificate(new crypto.X509Certificate(block));
            if (hosts.length > 0) return hosts;
        } catch {}
    }

    return [];
}

export async function readCustomCertHosts(certificateId: string): Promise<string[]> {
    const { certFile } = getCustomCertPaths(certificateId);
    try {
        return parseCertificateHosts(await fs.readFile(certFile, 'utf-8'));
    } catch {
        return [];
    }
}

export function certificateCoversHost(certificateDomain: string, host: string): boolean {
    const certDomain = certificateDomain.trim().toLowerCase();
    const target = host.trim().toLowerCase();
    if (!certDomain || !target) return false;
    if (certDomain === target) return true;

    if (certDomain.startsWith('*.')) {
        const suffix = certDomain.slice(1);
        if (!target.endsWith(suffix)) return false;
        const label = target.slice(0, target.length - suffix.length);
        return label.length > 0 && !label.includes('.');
    }

    return false;
}

export function certificateHostsCoverHost(certificateHosts: string[], host: string): boolean {
    return certificateHosts.some((certificateHost) => certificateCoversHost(certificateHost, host));
}

export async function backfillCustomCertCoveredDomains(): Promise<void> {
    const staleCerts = await prisma.sslCertificate.findMany({
        where: { type: 'CUSTOM', coveredDomains: { isEmpty: true } },
        select: { id: true },
    });

    for (const cert of staleCerts) {
        const hosts = await readCustomCertHosts(cert.id);
        if (hosts.length === 0) continue;

        await prisma.sslCertificate.update({ where: { id: cert.id }, data: { coveredDomains: hosts } }).catch(() => {});
    }
}

export async function regenerateCustomCertsConfig(): Promise<void> {
    const customCerts = await prisma.sslCertificate.findMany({
        where: { type: 'CUSTOM' },
        select: { id: true },
    });

    if (customCerts.length === 0) {
        await fs.unlink(CERTS_CONFIG_FILE).catch(() => {});
        return;
    }

    const config = {
        tls: {
            certificates: customCerts.map((cert) => ({
                certFile: `${TRAEFIK_CERTS_CONTAINER_PATH}/${cert.id}.pem`,
                keyFile: `${TRAEFIK_CERTS_CONTAINER_PATH}/${cert.id}.key`,
            })),
        },
    };

    await fs.mkdir(TRAEFIK_SERVICE_DIR, { recursive: true });
    await fs.writeFile(CERTS_CONFIG_FILE, yaml.stringify(config), 'utf-8');
}
