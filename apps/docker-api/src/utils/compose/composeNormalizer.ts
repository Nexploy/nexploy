import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import type { ComposeContent } from '@workspace/typescript-interface/docker/docker.compose.build';
import { buildComposeEnv, captureDockerCompose } from '@/utils/compose/dockerComposeRunner';

const YAML_EXTENSIONS = ['.yml', '.yaml'];

export function discoverComposeFiles(composeFilePath: string): string[] {
    const directory = path.dirname(composeFilePath);
    const extension = path.extname(composeFilePath);
    const baseName = path.basename(composeFilePath, extension);

    const overrides = YAML_EXTENSIONS.map((candidateExtension) =>
        path.join(directory, `${baseName}.override${candidateExtension}`),
    ).filter((candidate) => fs.existsSync(candidate));

    return [composeFilePath, ...overrides];
}

export interface NormalizeComposeOptions {
    composeFiles: string[];
    projectDirectory: string;
    projectName: string;
    envVars?: Record<string, string>;
    dockerEnv: Record<string, string>;
    profiles?: string[];
    signal?: AbortSignal;
}

export interface NormalizedCompose {
    composeContent: ComposeContent;
    yamlContent: string;
    warnings: string[];
}

function extractComposeWarnings(stderr: string): string[] {
    return stderr
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && /^(WARN|WARNING)/i.test(line));
}

function formatComposeError(stderr: string, composeFiles: string[]): string {
    const meaningful = stderr
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !/^(WARN|WARNING)/i.test(line));

    const detail = meaningful.length > 0 ? meaningful.join('; ') : 'docker compose config failed';
    const fileList = composeFiles.map((file) => path.basename(file)).join(', ');

    return `Invalid Docker Compose project (${fileList}): ${detail}`;
}

export async function normalizeComposeProject({
    composeFiles,
    projectDirectory,
    projectName,
    envVars,
    dockerEnv,
    profiles,
    signal,
}: NormalizeComposeOptions): Promise<NormalizedCompose> {
    const fileArgs = composeFiles.flatMap((file) => ['-f', file]);
    const profileArgs = (profiles || []).flatMap((profile) => ['--profile', profile]);

    const { exitCode, stdout, stderr } = await captureDockerCompose(
        ['-p', projectName, ...fileArgs, ...profileArgs, 'config', '--format', 'yaml', '--no-path-resolution'],
        projectDirectory,
        buildComposeEnv(dockerEnv, envVars),
        signal,
    );

    if (exitCode !== 0) {
        throw new Error(formatComposeError(stderr, composeFiles));
    }

    const composeContent = yaml.parse(stdout) as ComposeContent | null;

    if (!composeContent || typeof composeContent !== 'object') {
        throw new Error(`Docker Compose returned an empty configuration for ${composeFiles.join(', ')}`);
    }

    return {
        composeContent,
        yamlContent: stdout,
        warnings: extractComposeWarnings(stderr),
    };
}
