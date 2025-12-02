import { ReactNode } from 'react';

type SheetContentType = 'ADD_VOLUME' | ReactNode;

interface SheetData {
    title: string;
    description?: string;
    content: SheetContentType;
    side?: 'top' | 'right' | 'bottom' | 'left';
    onAction?: (data: any) => void;
    contextData?: any;
}

export interface SheetStore {
    isOpen: boolean;
    data: SheetData | null;
    openSheet: (data: SheetData) => void;
    closeSheet: () => void;
}
