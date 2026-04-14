'use client';

import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { useAncestorInputFields } from '@/hooks/useAncestorInputFields';

const RefValidationContext = createContext<Set<string>>(new Set());

interface RefValidationProviderProps {
    nodeId: string;
    children: ReactNode;
}

export function RefValidationProvider({ nodeId, children }: RefValidationProviderProps) {
    const ancestors = useAncestorInputFields(nodeId);
    const validIds = useMemo(() => new Set(ancestors.map((a) => a.nodeId)), [ancestors]);

    return (
        <RefValidationContext.Provider value={validIds}>{children}</RefValidationContext.Provider>
    );
}

export function useValidAncestorNodeIds(): Set<string> {
    const context = useContext(RefValidationContext);
    if (!context) {
        throw new Error('useValidAncestorNodeIds must be used within a RefValidationProvider');
    }
    return context;
}
