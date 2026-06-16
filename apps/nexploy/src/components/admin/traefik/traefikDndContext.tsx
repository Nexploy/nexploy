'use client';

import { createContext, useContext } from 'react';

export interface TraefikDndContextValue {
    activePath: string | null;
    dropTarget: string | null;
    setActivePath: (path: string | null) => void;
    setDropTarget: (path: string | null) => void;
    moveInto: (destDir: string) => void;
}

const TraefikDndContext = createContext<TraefikDndContextValue | null>(null);

export const TraefikDndProvider = TraefikDndContext.Provider;

export function useTraefikDnd(): TraefikDndContextValue {
    const ctx = useContext(TraefikDndContext);
    if (!ctx) {
        throw new Error('useTraefikDnd must be used within a TraefikDndProvider');
    }
    return ctx;
}
