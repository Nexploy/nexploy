/** Result of `docker system df` as returned by the docker-api `/api/system/df` route. */
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

/** Result of a single prune operation. */
export interface CleanupResult {
    reclaimedSpace: number;
}
