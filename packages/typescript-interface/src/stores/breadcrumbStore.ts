export type BreadcrumbOverrides = Record<string, string>;

export interface BreadcrumbStore {
    overrides: BreadcrumbOverrides;
    setOverrides: (segments: BreadcrumbOverrides) => void;
    clearOverrides: (keys: string[]) => void;
}
