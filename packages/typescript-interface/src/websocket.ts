export interface WSRouteConfig {
    prefix: string;
    params: string[];
    paramSpecs: Record<string, { optional: boolean; default?: string }>;
    zodSchema: any | null;
    transform: (params: Record<string, string>) => string;
}

export interface MatchResult {
    matched: boolean;
    url?: string;
    original?: string;
}
