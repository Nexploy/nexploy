export interface TraefikConfig {
    enabled: boolean;
    domain?: string;
    labels: Record<string, string>;
}

export interface Domain {
    id?: string;
    host: string;
    path: string;
    internalPath: string;
    stripPath: boolean;
    containerPort: number;
    https: boolean;
}
