import type { ComposeVolumeConfig } from './docker.compose.volume';

export interface ComposeService {
    image?: string;
    build?:
        | string
        | {
              context: string;
              dockerfile?: string;
              args?: Record<string, string> | string[];
              target?: string;
              cache_from?: string[];
              labels?: Record<string, string> | string[];
              shm_size?: string | number;
              extra_hosts?: string[];
          };
    container_name?: string;
    volumes?: (string | ComposeVolumeConfig)[];
    [key: string]: unknown;
}

export interface ComposeContent {
    version?: string;
    services?: Record<string, ComposeService>;
    networks?: Record<string, unknown>;
    volumes?: Record<string, unknown>;
}

export interface ParsedBuildConfig {
    serviceName: string;
    imageName: string;
    contextPath: string;
    dockerfile: string;
    buildArgs: Record<string, string>;
    target?: string;
    cacheFrom?: string[];
    labels?: Record<string, string>;
    shmSize?: number;
    extraHosts?: string[];
}

export interface BuildProgress {
    type: 'log' | 'error' | 'complete';
    serviceName: string;
    message?: string;
    imageId?: string;
}

export interface ComposeBuildResult {
    builtImages: Map<string, string>;
    errors: Map<string, Error>;
}
