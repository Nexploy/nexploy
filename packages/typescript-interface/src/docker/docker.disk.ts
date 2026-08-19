export interface HostDiskUsage {
    path: string;
    totalBytes: number;
    freeBytes: number;
    usedBytes: number;
    usedPercent: number;
}

export type DiskGuardLevel = 'ok' | 'warn' | 'block';

export interface DiskGuardSettings {
    enabled: boolean;
    warnPercent: number;
    blockPercent: number;
    minFreeMb: number;
}

export interface DiskGuardStatus extends HostDiskUsage {
    level: DiskGuardLevel;
    settings: DiskGuardSettings;
}
