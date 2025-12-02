export interface DeployOptions {
    containerName?: string;
    port?: number;
    envVars?: Record<string, string>;
    traefik?: TraefikOptions;
}

export interface TraefikOptions {
    enabled: boolean;
    domain?: string;
    labels?: Record<string, string>;
}
