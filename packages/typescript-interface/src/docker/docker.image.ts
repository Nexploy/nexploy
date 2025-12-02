import { DropdownActionTool } from '../commun';

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
    timestamp: number;
}

export type ImageType = 'initial' | 'state-change' | 'updated' | 'added' | 'removed' | 'heartbeat';
export type ImageAction = 'pull' | 'push' | 'tag' | 'untag' | 'delete' | 'import' | 'load' | 'save';

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

export type ImageRow = Image & {
    isGroup?: boolean;
    groupName?: string;
    subRows?: ImageRow[];
};
