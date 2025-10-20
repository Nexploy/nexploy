export interface DockerImage {
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
