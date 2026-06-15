'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';
import {
    createTraefikConfigStore,
    TraefikConfigContext,
    type TraefikConfigStore,
} from './useTraefikConfigStore';
import type { TraefikTreeNode } from '@/lib/traefik/types';

export function TraefikConfigProvider({
    initialTree,
    children,
}: {
    initialTree: TraefikTreeNode[];
    children: ReactNode;
}) {
    const storeRef = useRef<TraefikConfigStore>(null);
    if (!storeRef.current) {
        storeRef.current = createTraefikConfigStore(initialTree);
    }
    return (
        <TraefikConfigContext.Provider value={storeRef.current}>
            {children}
        </TraefikConfigContext.Provider>
    );
}
