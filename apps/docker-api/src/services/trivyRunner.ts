import type { Writable } from 'stream';
import { getCurrentDockerClient } from '@/lib/dockerContext';
import type { ScanImageResult } from '@workspace/typescript-interface/docker/docker.image';

const TRIVY_IMAGE_BASE = 'aquasec/trivy';

export const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
export type Severity = (typeof SEVERITY_ORDER)[number];

export function getSeveritiesAbove(severity: Severity): string {
    const idx = SEVERITY_ORDER.indexOf(severity);
    return SEVERITY_ORDER.slice(0, idx + 1).join(',');
}

async function ensureTrivyImage(trivyVersion: string): Promise<string> {
    const docker = getCurrentDockerClient();
    const image = `${TRIVY_IMAGE_BASE}:${trivyVersion}`;
    try {
        await docker.getImage(image).inspect();
    } catch {
        await new Promise<void>((resolve, reject) => {
            docker.pull(image, (err: any, stream: any) => {
                if (err) return reject(err);
                docker.modem.followProgress(stream, (error: any) => {
                    if (error) return reject(error);
                    resolve();
                });
            });
        });
    }
    return image;
}

async function getOrCreateDaemonContainer(trivyVersion: string, buildId: string) {
    const docker = getCurrentDockerClient();
    const image = await ensureTrivyImage(trivyVersion);
    const name = `trivy-scan-${buildId}`;

    try {
        const container = docker.getContainer(name);
        const info = await container.inspect();
        if (!info.State.Running) {
            await container.start();
        }
        return container;
    } catch {
        const container = await docker.createContainer({
            Image: image,
            name,
            Entrypoint: ['sleep', 'infinity'],
            Cmd: [],
            HostConfig: {
                Binds: ['/var/run/docker.sock:/var/run/docker.sock'],
                AutoRemove: false,
                RestartPolicy: { Name: 'no' },
            },
        });
        await container.start();
        return container;
    }
}

export async function runTrivyContainer(
    cmd: string[],
    trivyVersion = 'canary',
    buildId: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const docker = getCurrentDockerClient();
    const container = await getOrCreateDaemonContainer(trivyVersion, buildId);

    const exec = await container.exec({
        Cmd: ['trivy', ...cmd],
        AttachStdout: true,
        AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true, stdin: false });

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
    });

    const { ExitCode: exitCode } = await exec.inspect();
    return { stdout, stderr, exitCode: exitCode ?? 0 };
}

export async function scanImage(
    image: string,
    tag: string,
    severity: Severity,
    trivyVersion = 'canary',
    buildId: string,
): Promise<ScanImageResult> {
    const fullImage = `${image}:${tag}`;
    const severities = getSeveritiesAbove(severity);

    const { stdout, stderr, exitCode } = await runTrivyContainer(
        [
            'image',
            '--format',
            'json',
            '--severity',
            severities,
            '--no-progress',
            '--quiet',
            fullImage,
        ],
        trivyVersion,
        buildId,
    );

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
                lines.push(
                    `  [${v.Severity}] ${v.VulnerabilityID ?? '?'} - ${v.Title ?? 'no title'}`,
                );
            }
            if (allVulns.length > 10) lines.push(`  ... and ${allVulns.length - 10} more`);
        }
    }

    try {
        const docker = getCurrentDockerClient();
        const container = docker.getContainer(`trivy-scan-${buildId}`);
        await container.stop();
        await container.remove();
    } catch {}

    return { vulnerabilities, critical, high, output: lines.join('\n') };
}
