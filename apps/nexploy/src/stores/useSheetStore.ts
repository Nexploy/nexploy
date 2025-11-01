import { ReactNode } from 'react';
import { create } from 'zustand/react';

type SheetContentType = 'ADD_VOLUME' | ReactNode;

interface SheetData {
    title: string;
    description?: string;
    content: SheetContentType;
    side?: 'top' | 'right' | 'bottom' | 'left';
    onAction?: (data: any) => void;
    contextData?: any;
}

interface SheetStore {
    isOpen: boolean;
    data: SheetData | null;
    openSheet: (data: SheetData) => void;
    closeSheet: () => void;
}

export const useSheetStore = create<SheetStore>((set) => ({
    isOpen: false,
    data: null,
    openSheet: (data) => set({ isOpen: true, data }),
    closeSheet: () => set({ isOpen: false }),
}));
