export interface EnvironmentConfig {
    id: string;
    name: string;
    connectionType: 'UNIX_SOCKET' | 'TCP' | 'TCP_TLS';
    socketPath?: string;
    host?: string;
    port?: number;
    tlsCert?: string;
    tlsKey?: string;
    tlsCa?: string;
    isDefault?: boolean;
}

export interface Environment extends EnvironmentConfig {
    isActive: boolean;
    description?: string | null;
    lastHealthCheck?: Date | null;
    healthStatus?: string | null;
    createdAt: Date;
    updatedAt: Date;
    userId?: string | null;
}
