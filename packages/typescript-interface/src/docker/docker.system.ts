export interface DiskUsage {
    layersSize: number;
    images: {
        total: number;
        active: number;
        size: number;
        reclaimable: number;
    };
    containers: {
        total: number;
        running: number;
        size: number;
        reclaimable: number;
    };
    volumes: {
        total: number;
        active: number;
        size: number;
        reclaimable: number;
    };
    buildCache: {
        total: number;
        size: number;
        reclaimable: number;
    };
    totalSize: number;
    totalReclaimable: number;
}

export interface DockerEngineVersion {
    version: string;
    apiVersion: string;
    minApiVersion: string | null;
    gitCommit: string | null;
    goVersion: string | null;
    os: string | null;
    arch: string | null;
    kernelVersion: string | null;
    buildTime: string | null;
    platformName: string | null;
}

export interface CleanupResult {
    reclaimedSpace: number;
}
