export interface Volume {
    name: string;
    driver: string;
    mountpoint: string;
    createdAt: number;
    labels: { [key: string]: string };
    scope: string;
    options: { [key: string]: string };
    usageData?: {
        Size: number;
        RefCount: number;
    } | null;
    timestamp: number;
}

export type VolumeAction = 'create' | 'mount' | 'unmount' | 'destroy';

export type VolumeDeleteResult =
    | { type: 'deleted'; name: string }
    | { type: 'skipped'; name: string; reason: string };

export interface VolumeDeleteResponse {
    deleted: string[];
    skipped: { name: string; reason: string }[];
}

export interface VolumeStateChanges {
    labels?: {
        from: { [key: string]: string };
        to: { [key: string]: string };
    };
    options?: {
        from: { [key: string]: string };
        to: { [key: string]: string };
    };
    usageData?: {
        from?: {
            Size: number;
            RefCount: number;
        } | null;
        to?: {
            Size: number;
            RefCount: number;
        } | null;
    };
}

export type VolumeType = 'initial' | 'state-change' | 'updated' | 'added' | 'removed' | 'heartbeat';

export interface VolumeEvent {
    type: VolumeType;
    timestamp: number;
    volumes?: Volume[];
    volume?: Volume;
    oldState?: Volume;
    volumeName?: string;
    changes?: VolumeStateChanges;
}

export type Mount = {
    type: string;
    source: string;
    destination: string;
    rw: boolean;
    name?: string;
    driver?: string;
};
