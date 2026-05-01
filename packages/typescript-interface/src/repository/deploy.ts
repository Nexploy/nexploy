export interface DeployOptions {
    containerName?: string;
    envVars?: Record<string, string>;
    labels?: Record<string, string>;
}

export interface TraefikOptions {
    enabled: boolean;
    domain?: string;
    labels?: Record<string, string>;
}
