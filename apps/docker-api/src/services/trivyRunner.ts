import type { Writable } from 'stream';
import { getCurrentDockerClient } from '@/lib/dockerContext';

const TRIVY_IMAGE_BASE = 'aquasec/trivy';

export const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
export type Severity = (typeof SEVERITY_ORDER)[number];

export function getSeveritiesAbove(severity: Severity): string {
    const idx = SEVERITY_ORDER.indexOf(severity);
    return SEVERITY_ORDER.slice(0, idx + 1).join(',');
}

export async function runTrivyContainer(
    cmd: string[],
    trivyVersion = 'canary',
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const docker = getCurrentDockerClient();
    const TRIVY_IMAGE = `${TRIVY_IMAGE_BASE}:${trivyVersion}`;

    try {
        await docker.getImage(TRIVY_IMAGE).inspect();
    } catch {
        await new Promise<void>((resolve, reject) => {
            docker.pull(TRIVY_IMAGE, (err: any, stream: any) => {
                if (err) return reject(err);
                docker.modem.followProgress(stream, (error: any) => {
                    if (error) return reject(error);
                    resolve();
                });
            });
        });
    }

    const container = await docker.createContainer({
        Image: TRIVY_IMAGE,
        Cmd: cmd,
        HostConfig: {
            Binds: ['/var/run/docker.sock:/var/run/docker.sock'],
            AutoRemove: false,
        },
    });

    const stream = await container.attach({ stream: true, stdout: true, stderr: true });

    let stdout = '';
    let stderr = '';

    const stdoutSink: Writable = {
        write: (chunk: Buffer) => {
            stdout += chunk.toString();
            return true;
        },
    } as unknown as Writable;

    const stderrSink: Writable = {
        write: (chunk: Buffer) => {
            stderr += chunk.toString();
            return true;
        },
    } as unknown as Writable;

    await new Promise<void>((resolve, reject) => {
        docker.modem.demuxStream(stream, stdoutSink, stderrSink);
        stream.on('end', resolve);
        stream.on('error', reject);
        container.start().catch(reject);
    });

    const { StatusCode: exitCode } = await container.wait();
    await container.remove({ force: true }).catch(() => {});

    return { stdout, stderr, exitCode };
}

export interface ScanImageResult {
    vulnerabilities: number;
    critical: number;
    high: number;
    output: string;
}

export async function scanImage(
    image: string,
    tag: string,
    severity: Severity,
    trivyVersion = 'canary',
): Promise<ScanImageResult> {
    const fullImage = `${image}:${tag}`;
    const severities = getSeveritiesAbove(severity);

    const { stdout, stderr, exitCode } = await runTrivyContainer([
        'image',
        '--format', 'json',
        '--severity', severities,
        '--no-progress',
        '--quiet',
        fullImage,
    ], trivyVersion);

    if (exitCode !== 0 && !stdout.trim()) {
        throw new Error(`Trivy scan failed: ${stderr.trim() || 'unknown error'}`);
    }

    let trivyResult: {
        Results?: Array<{
            Vulnerabilities?: Array<{ Severity: string; VulnerabilityID?: string; Title?: string }>;
        }>;
    } = {};
    try {
        trivyResult = JSON.parse(stdout || '{}');
    } catch {
        throw new Error(`Failed to parse Trivy output: ${stdout.slice(0, 200)}`);
    }

    const allVulns = (trivyResult.Results ?? []).flatMap((r) => r.Vulnerabilities ?? []);
    const critical = allVulns.filter((v) => v.Severity === 'CRITICAL').length;
    const high = allVulns.filter((v) => v.Severity === 'HIGH').length;
    const vulnerabilities = allVulns.length;

    const lines: string[] = [];
    if (vulnerabilities === 0) {
        lines.push(`No ${severities} vulnerabilities found in ${fullImage}`);
    } else {
        lines.push(`Found ${vulnerabilities} vulnerabilities in ${fullImage}:`);
        for (const sev of SEVERITY_ORDER) {
            const count = allVulns.filter((v) => v.Severity === sev).length;
            if (count > 0) lines.push(`  ${sev}: ${count}`);
        }
        const top = allVulns.slice(0, 10);
        if (top.length > 0) {
            lines.push('');
            lines.push('Top vulnerabilities:');
            for (const v of top) {
                lines.push(`  [${v.Severity}] ${v.VulnerabilityID ?? '?'} - ${v.Title ?? 'no title'}`);
            }
            if (allVulns.length > 10) lines.push(`  ... and ${allVulns.length - 10} more`);
        }
    }

    return { vulnerabilities, critical, high, output: lines.join('\n') };
}
