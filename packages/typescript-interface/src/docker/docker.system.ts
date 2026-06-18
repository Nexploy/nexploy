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

export interface CleanupResult {
    reclaimedSpace: number;
}
