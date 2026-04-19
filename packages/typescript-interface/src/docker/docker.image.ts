import { DropdownActionTool } from '../commun';

export interface ImageConfig {
    cmd: string[] | null;
    entrypoint: string[] | null;
    env: string[];
    workingDir: string;
    exposedPorts: Record<string, object>;
    volumes: Record<string, object> | null;
    user: string;
    shell: string[] | null;
    stopSignal: string;
}

export interface Image {
    id: string;
    fullId: string;
    name: string[];
    tag: string[];
    repoTags: string[];
    repoDigests: string[];
    created: number;
    size: number;
    virtualSize: number;
    sharedSize: number;
    labels: Record<string, string>;
    containersUsed: number;
    parent?: string;
    architecture?: string;
    os?: string;
    config?: ImageConfig;
    timestamp: number;
}

export type ImageType = 'initial' | 'state-change' | 'updated' | 'added' | 'removed' | 'heartbeat';
export type ImageAction = 'pull' | 'push' | 'tag' | 'untag' | 'delete' | 'import' | 'load' | 'save';

export type ImageDeleteResult =
    | { type: 'deleted'; id: string }
    | { type: 'skipped'; id: string; name: string; reason: string };

export interface ImageDeleteResponse {
    deleted: string[];
    skipped: { id: string; name: string; reason: string }[];
}

export interface ImageTool extends DropdownActionTool {
    disabled?: boolean;
    variant?: 'default' | 'destructive';
    tooltipContent?: string;
}

export interface ImageEvent {
    type: ImageType;
    timestamp: number;
    action?: ImageAction;
    images?: Image[];
    image?: Image;
    oldState?: Image;
    changes?: ImageStateChanges;
    imageId?: string;
}

export interface ImageStateChanges {
    repoTags?: {
        from: string[];
        to: string[];
    };
    size?: {
        from: number;
        to: number;
    };
    containers?: {
        from: number;
        to: number;
    };
}

export interface ImageDetail extends Image {
    dockerVersion: string;
    author: string;
    comment: string;
    config: {
        hostname: string;
        user: string;
        env: string[];
        cmd: string[] | null;
        entrypoint: string[] | null;
        workingDir: string;
        exposedPorts: Record<string, object>;
        volumes: Record<string, object> | null;
        labels: Record<string, string>;
        shell: string[] | null;
        stopSignal: string;
    };
    rootFS: {
        type: string;
        layers: string[];
    };
    graphDriver: {
        name: string;
        data: Record<string, string>;
    };
}

export interface ImageHistoryEntry {
    id: string;
    created: number;
    createdBy: string;
    size: number;
    comment: string;
    tags: string[] | null;
}

export type ImageRow = Image & {
    isGroup?: boolean;
    groupName?: string;
    subRows?: ImageRow[];
};

export interface ScanImageResult {
    vulnerabilities: number;
    critical: number;
    high: number;
    output: string;
}
