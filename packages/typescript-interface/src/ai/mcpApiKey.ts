export interface McpApiKey {
    id: string;
    name: string | null;
    start: string | null;
    createdAt: Date;
    expiresAt: Date | null;
}
