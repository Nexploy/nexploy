'use client';

import { createContext, useContext } from 'react';
import type { PipelineStore } from '@/stores/pipeline/createPipelineStore';

export const PipelineContext = createContext<PipelineStore | null>(null);

export function usePipelineStoreInstance(): PipelineStore {
    const store = useContext(PipelineContext);
    if (!store) throw new Error('usePipelineStore must be used within PipelineProvider');
    return store;
}
