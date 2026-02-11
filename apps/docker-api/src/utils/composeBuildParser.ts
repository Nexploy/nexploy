import path from 'path';
import type {
    ComposeContent,
    ComposeService,
    ParsedBuildConfig,
} from '@workspace/typescript-interface/docker/docker.compose.build';

export type { ComposeContent, ComposeService, ParsedBuildConfig };

function parseSizeToBytes(size: string | number): number {
    if (typeof size === 'number') {
        return size;
    }

    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([kmgt]?b?)?$/);
    if (!match) {
        return parseInt(size, 10) || 0;
    }

    const value = parseFloat(match[1]);
    const unit = match[2] || '';

    const multipliers: Record<string, number> = {
        '': 1,
        b: 1,
        k: 1024,
        kb: 1024,
        m: 1024 * 1024,
        mb: 1024 * 1024,
        g: 1024 * 1024 * 1024,
        gb: 1024 * 1024 * 1024,
        t: 1024 * 1024 * 1024 * 1024,
        tb: 1024 * 1024 * 1024 * 1024,
    };

    return Math.floor(value * (multipliers[unit] || 1));
}

function parseBuildArgs(
    args: Record<string, string> | string[] | undefined,
): Record<string, string> {
    if (!args) {
        return {};
    }

    if (Array.isArray(args)) {
        const result: Record<string, string> = {};
        for (const arg of args) {
            const eqIndex = arg.indexOf('=');
            if (eqIndex > 0) {
                result[arg.substring(0, eqIndex)] = arg.substring(eqIndex + 1);
            } else {
                result[arg] = process.env[arg] || '';
            }
        }
        return result;
    }

    return { ...args };
}

function parseLabels(
    labels: Record<string, string> | string[] | undefined,
): Record<string, string> | undefined {
    if (!labels) {
        return undefined;
    }

    if (Array.isArray(labels)) {
        const result: Record<string, string> = {};
        for (const label of labels) {
            const eqIndex = label.indexOf('=');
            if (eqIndex > 0) {
                result[label.substring(0, eqIndex)] = label.substring(eqIndex + 1);
            } else {
                result[label] = '';
            }
        }
        return result;
    }

    return { ...labels };
}

export function parseComposeBuildConfigs(
    composeContent: ComposeContent,
    projectName: string,
    workDir: string,
    buildId?: string,
): ParsedBuildConfig[] {
    const configs: ParsedBuildConfig[] = [];

    for (const [serviceName, service] of Object.entries(composeContent.services || {})) {
        if (!service.build) {
            continue;
        }

        const baseImageName = service.image || `${projectName}_${serviceName}`;
        const imageName = buildId ? `${baseImageName}:${buildId}` : baseImageName;

        let contextPath: string;
        let dockerfile = 'Dockerfile';
        let buildArgs: Record<string, string> = {};
        let target: string | undefined;
        let cacheFrom: string[] | undefined;
        let labels: Record<string, string> | undefined;
        let shmSize: number | undefined;
        let extraHosts: string[] | undefined;

        if (typeof service.build === 'string') {
            contextPath = path.resolve(workDir, service.build);
        } else {
            contextPath = path.resolve(workDir, service.build.context);

            if (service.build.dockerfile) {
                dockerfile = service.build.dockerfile;
            }

            buildArgs = parseBuildArgs(service.build.args);
            target = service.build.target;
            cacheFrom = service.build.cache_from;
            labels = parseLabels(service.build.labels);
            extraHosts = service.build.extra_hosts;

            if (service.build.shm_size) {
                shmSize = parseSizeToBytes(service.build.shm_size);
            }
        }

        configs.push({
            serviceName,
            imageName,
            contextPath,
            dockerfile,
            buildArgs,
            target,
            cacheFrom,
            labels,
            shmSize,
            extraHosts,
        });
    }

    return configs;
}

export function getServicesToPull(composeContent: ComposeContent): string[] {
    return Object.entries(composeContent.services || {})
        .filter(([, service]) => service.image && !service.build)
        .map(([name]) => name);
}

export function getServicesToBuild(composeContent: ComposeContent): string[] {
    return Object.entries(composeContent.services || {})
        .filter(([, service]) => service.build)
        .map(([name]) => name);
}

export function getExplicitContainerNames(composeContent: ComposeContent): string[] {
    return Object.values(composeContent.services || {})
        .map((service) => service.container_name)
        .filter((name): name is string => !!name);
}
