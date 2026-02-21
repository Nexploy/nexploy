import { create } from 'zustand';

type BreadcrumbOverrides = Record<string, string>;

type BreadcrumbStore = {
    overrides: BreadcrumbOverrides;
    setOverrides: (segments: BreadcrumbOverrides) => void;
    clearOverrides: (keys: string[]) => void;
};

export const useBreadcrumbStore = create<BreadcrumbStore>((set) => ({
    overrides: {},
    setOverrides: (segments) =>
        set((state) => ({ overrides: { ...state.overrides, ...segments } })),
    clearOverrides: (keys) =>
        set((state) => {
            const overrides = { ...state.overrides };
            keys.forEach((key) => delete overrides[key]);
            return { overrides };
        }),
}));
