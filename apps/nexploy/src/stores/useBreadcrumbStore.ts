import { create } from 'zustand';
import type { BreadcrumbStore } from '@workspace/typescript-interface/stores/breadcrumbStore';

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
