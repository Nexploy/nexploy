export interface Image {
    id: string;
    repoTags: string[];
    repoDigests: string[];
    created: number;
    size: number;
    virtualSize: number;
    sharedSize: number;
    labels: Record<string, string>;
    containers: number;
    parent?: string;
    architecture?: string;
    os?: string;
    timestamp: number;
}

export interface ImageEvent {
    timestamp: number;
    action?: 'pull' | 'push' | 'tag' | 'untag' | 'delete' | 'import' | 'load' | 'save';
    image?: Image;
    imageId?: string;
    images?: Image[];
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
    }
}
