'use client';

import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { type AncestorWithInputs, useAncestorInputFields } from '@/hooks/useAncestorInputFields';

interface RefValidationContextValue {
    validIds: Set<string>;
    ancestors: AncestorWithInputs[];
}

const RefValidationContext = createContext<RefValidationContextValue>({
    validIds: new Set(),
    ancestors: [],
});

interface RefValidationProviderProps {
    nodeId: string;
    children: ReactNode;
}

export function RefValidationProvider({ nodeId, children }: RefValidationProviderProps) {
    const ancestors = useAncestorInputFields(nodeId);
    const validIds = useMemo(() => new Set(ancestors.map((a) => a.nodeId)), [ancestors]);
    const value = useMemo(() => ({ validIds, ancestors }), [validIds, ancestors]);

    return <RefValidationContext.Provider value={value}>{children}</RefValidationContext.Provider>;
}

export function useValidAncestorNodeIds(): Set<string> {
    return useContext(RefValidationContext).validIds;
}

export function useAncestorIndex(nodeId: string): number | undefined {
    const { ancestors } = useContext(RefValidationContext);
    const idx = ancestors.findIndex((a) => a.nodeId === nodeId);
    return idx === -1 ? undefined : idx + 1;
}
