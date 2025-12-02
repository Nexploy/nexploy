export interface TraefikConfig {
    enabled: boolean;
    domain?: string;
    labels: Record<string, string>;
}
