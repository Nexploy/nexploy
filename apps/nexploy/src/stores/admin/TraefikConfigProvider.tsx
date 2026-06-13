'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';
import {
    createTraefikConfigStore,
    TraefikConfigContext,
    type TraefikConfigStore,
    type TraefikFile,
} from './useTraefikConfigStore';

export function TraefikConfigProvider({
    initialFiles,
    children,
}: {
    initialFiles: TraefikFile[];
    children: ReactNode;
}) {
    const storeRef = useRef<TraefikConfigStore>(null);
    if (!storeRef.current) {
        storeRef.current = createTraefikConfigStore(initialFiles);
    }
    return (
        <TraefikConfigContext.Provider value={storeRef.current}>
            {children}
        </TraefikConfigContext.Provider>
    );
}
