import { create } from 'zustand/react';
import { SheetStore } from '@workspace/typescript-interface/stores/sheetStore';

export const useSheetStore = create<SheetStore>((set) => ({
    isOpen: false,
    data: null,
    openSheet: (data) => set({ isOpen: true, data }),
    closeSheet: () => set({ isOpen: false }),
}));
