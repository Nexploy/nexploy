import path from 'path';
import fs from 'fs';
import type { ComposeContent } from '@workspace/typescript-interface/docker/docker.compose.build';
import type {
    BindMountClassification,
    ComposeVolumeConfig,
    ParsedBindMount,
} from '@workspace/typescript-interface/docker/docker.compose.volume';

const CODE_EXTENSIONS = new Set([
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.py',
    '.go',
    '.rs',
    '.java',
    '.rb',
    '.php',
    '.c',
    '.cpp',
    '.h',
    '.cs',
    '.swift',
    '.kt',
    '.scala',
    '.vue',
    '.svelte',
]);

const CODE_INDICATOR_FILES = new Set([
    'package.json',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'requirements.txt',
    'pipfile',
    'pyproject.toml',
    'setup.py',
    'go.mod',
    'cargo.toml',
    'pom.xml',
    'build.gradle',
    'gemfile',
    'composer.json',
    'dockerfile',
    'makefile',
    'cmakelists.txt',
    'tsconfig.json',
    'vite.config.ts',
    'vite.config.js',
    'webpack.config.js',
    'next.config.js',
    'nuxt.config.ts',
]);

const DATA_DIRECTORY_PATTERNS = [
    'data',
    'uploads',
    'storage',
    'logs',
    'cache',
    'temp',
    'tmp',
    'db',
    'database',
    'backups',
    'media',
    'public/uploads',
    'var',
    'output',
    'dist',
    'build',
];

export function isBindMount(volumeSpec: string | ComposeVolumeConfig): boolean {
    if (typeof volumeSpec === 'object') {
        return (
            volumeSpec.type === 'bind' ||
            volumeSpec.source?.startsWith('./') ||
            volumeSpec.source?.startsWith('../')
        );
    }
    return volumeSpec.startsWith('./') || volumeSpec.startsWith('../');
}

export function parseVolumeSpec(volumeSpec: string | ComposeVolumeConfig): {
    hostPath: string;
    containerPath: string;
    readOnly: boolean;
} | null {
    if (typeof volumeSpec === 'object') {
        if (
            volumeSpec.type === 'bind' ||
            volumeSpec.source?.startsWith('./') ||
            volumeSpec.source?.startsWith('../')
        ) {
            return {
                hostPath: volumeSpec.source,
                containerPath: volumeSpec.target,
                readOnly: volumeSpec.read_only || false,
            };
        }
        return null;
    }

    const parts = volumeSpec.split(':');
    if (parts.length < 2) return null;

    const hostPath = parts[0];
    const containerPath = parts[1];
    const readOnly = parts[2] === 'ro';

    if (!hostPath.startsWith('./') && !hostPath.startsWith('../')) {
        return null;
    }

    return { hostPath, containerPath, readOnly };
}

export function classifyBindMount(
    absolutePath: string,
    hostPath: string,
): { classification: BindMountClassification; reason: string } {
    if (!fs.existsSync(absolutePath)) {
        return { classification: 'unknown', reason: 'Path does not exist' };
    }

    const stats = fs.statSync(absolutePath);

    if (stats.isFile()) {
        const ext = path.extname(absolutePath).toLowerCase();
        if (CODE_EXTENSIONS.has(ext)) {
            return { classification: 'code', reason: `Source file with extension ${ext}` };
        }
        return { classification: 'data', reason: 'Non-code file' };
    }

    if (stats.isDirectory()) {
        const dirName = path.basename(absolutePath).toLowerCase();
        const normalizedHostPath = hostPath.toLowerCase();

        for (const pattern of DATA_DIRECTORY_PATTERNS) {
            if (dirName === pattern || normalizedHostPath.includes(`/${pattern}`)) {
                return {
                    classification: 'data',
                    reason: `Directory name suggests data storage: ${pattern}`,
                };
            }
        }

        try {
            const files = fs.readdirSync(absolutePath);

            for (const file of files) {
                if (CODE_INDICATOR_FILES.has(file.toLowerCase())) {
                    return {
                        classification: 'code',
                        reason: `Contains code indicator file: ${file}`,
                    };
                }
            }

            const hasSourceFiles = files.some((file) => {
                const ext = path.extname(file).toLowerCase();
                return CODE_EXTENSIONS.has(ext);
            });

            if (hasSourceFiles) {
                return { classification: 'code', reason: 'Contains source code files' };
            }

            if (files.length === 0) {
                return { classification: 'data', reason: 'Empty directory, treating as data' };
            }
        } catch {}
    }

    return { classification: 'data', reason: 'Unable to determine, defaulting to data' };
}

export function parseComposeBindMounts(
    composeContent: ComposeContent,
    workDir: string,
): ParsedBindMount[] {
    const bindMounts: ParsedBindMount[] = [];

    for (const [serviceName, service] of Object.entries(composeContent.services || {})) {
        const volumes = service.volumes;
        if (!volumes || !Array.isArray(volumes)) continue;

        for (const volumeSpec of volumes) {
            if (!isBindMount(volumeSpec as string | ComposeVolumeConfig)) continue;

            const parsed = parseVolumeSpec(volumeSpec as string | ComposeVolumeConfig);
            if (!parsed) continue;

            const absoluteHostPath = path.resolve(workDir, parsed.hostPath);
            const exists = fs.existsSync(absoluteHostPath);

            const { classification, reason } = exists
                ? classifyBindMount(absoluteHostPath, parsed.hostPath)
                : { classification: 'unknown' as const, reason: 'Path does not exist' };

            bindMounts.push({
                serviceName,
                hostPath: parsed.hostPath,
                containerPath: parsed.containerPath,
                readOnly: parsed.readOnly,
                absoluteHostPath,
                exists,
                classification,
                classificationReason: reason,
            });
        }
    }

    return bindMounts;
}

export function getBindMountsByService(
    bindMounts: ParsedBindMount[],
): Map<string, ParsedBindMount[]> {
    const result = new Map<string, ParsedBindMount[]>();

    for (const mount of bindMounts) {
        const existing = result.get(mount.serviceName) || [];
        existing.push(mount);
        result.set(mount.serviceName, existing);
    }

    return result;
}
