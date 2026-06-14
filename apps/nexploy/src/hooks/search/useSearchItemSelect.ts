'use client';

import { useRef } from 'react';
import { useSearchStore } from '@/stores/useSearchStore';

export function useSearchItemSelect() {
    const setCommandValue = useSearchStore((s) => s.setCommandValue);
    const pointerSelectRef = useRef(false);

    return (value: string, action: () => void) => ({
        value,
        className: 'hover:bg-muted/50 cursor-pointer data-[selected=true]:hover:bg-accent',
        onPointerDown: () => {
            pointerSelectRef.current = true;
        },
        onSelect: () => {
            if (pointerSelectRef.current) {
                pointerSelectRef.current = false;
                setCommandValue(value);
                return;
            }
            action();
        },
        onDoubleClick: action,
    });
}
