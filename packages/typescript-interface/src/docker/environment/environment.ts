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
