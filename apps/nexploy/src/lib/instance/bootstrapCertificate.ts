import * as fs from 'fs/promises';
import { prisma } from '../../../prisma/prisma';
import {
    customCertFilesExist,
    getCustomCertPaths,
    parseCertificateExpiry,
    parseCertificateHosts,
} from '@/lib/traefik/customCerts';
import { getInstanceHost } from './domain';
import { getInstanceCertificateId, resolveInstanceTlsMode } from './tlsMode';

export async function ensureInstanceCertificateRecord(): Promise<void> {
    if (resolveInstanceTlsMode() !== 'custom') return;

    const certificateId = getInstanceCertificateId();
    if (!certificateId) return;

    const existing = await prisma.sslCertificate.findUnique({
        where: { id: certificateId },
        select: { id: true },
    });
    if (existing) return;

    if (!(await customCertFilesExist(certificateId))) {
        console.warn(`⚠️ Instance certificate ${certificateId} has no files on disk, skipping its registration`);
        return;
    }

    const { certFile } = getCustomCertPaths(certificateId);
    const certificatePem = await fs.readFile(certFile, 'utf-8');
    const coveredDomains = parseCertificateHosts(certificatePem);
    const label = coveredDomains[0] ?? getInstanceHost();

    if (!label) {
        console.warn(`⚠️ Instance certificate ${certificateId} covers no usable host, skipping its registration`);
        return;
    }

    await prisma.sslCertificate.create({
        data: {
            id: certificateId,
            name: label,
            type: 'CUSTOM',
            domain: label,
            email: '',
            expiresAt: parseCertificateExpiry(certificatePem),
            coveredDomains,
        },
    });

    console.log(`✓ Registered the instance certificate provided at install time (${label})`);
}
