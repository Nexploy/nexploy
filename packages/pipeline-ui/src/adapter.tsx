'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Containers } from '@workspace/typescript-interface/docker/docker.containers';
import type { Image } from '@workspace/typescript-interface/docker/docker.image';
import type { Network } from '@workspace/typescript-interface/docker/docker.network';
import type { Volume } from '@workspace/typescript-interface/docker/docker.volume';

export interface NodeEnvironmentSummary {
    id: string;
    name: string;
    connectionType?: string | null;
}

export interface NodeSwarmService {
    id: string;
    name: string;
}

export interface ResourceResult<T> {
    data: T | undefined;
    isLoading: boolean;
    mutate: () => void;
}

export interface NodesUIAdapter {
    useEnvironmentId(): string | undefined;
    usePanelNodeId(): string | undefined;
    useStageId(): string | undefined;
    useEnvironments(): NodeEnvironmentSummary[];
    useSwarmServices(): NodeSwarmService[];
    useContainers(environmentId?: string): { containers: Containers[]; isLoading: boolean };
    useImages(environmentId?: string): { images: Image[]; isLoading: boolean };
    useVolumes(environmentId?: string): { volumes: Volume[]; isLoading: boolean };
    useNetworks(environmentId?: string): { networks: Network[]; isLoading: boolean };
    useResource<T>(url: string | null): ResourceResult<T>;
}

const NodesUIContext = createContext<NodesUIAdapter | null>(null);

export function NodesUIProvider({ adapter, children }: { adapter: NodesUIAdapter; children: ReactNode }) {
    return <NodesUIContext.Provider value={adapter}>{children}</NodesUIContext.Provider>;
}

function useAdapter(): NodesUIAdapter {
    const adapter = useContext(NodesUIContext);
    if (!adapter) {
        throw new Error('Pipeline node config panels must be rendered inside a <NodesUIProvider>');
    }
    return adapter;
}

export function useNodeEnvironmentId(): string | undefined {
    return useAdapter().useEnvironmentId();
}

export function useNodePanelNodeId(): string | undefined {
    return useAdapter().usePanelNodeId();
}

export function useNodeStageId(): string | undefined {
    return useAdapter().useStageId();
}

export function useNodeEnvironments(): NodeEnvironmentSummary[] {
    return useAdapter().useEnvironments();
}

export function useNodeSwarmServices(): NodeSwarmService[] {
    return useAdapter().useSwarmServices();
}

export function useNodeContainers(environmentId?: string) {
    return useAdapter().useContainers(environmentId);
}

export function useNodeImages(environmentId?: string) {
    return useAdapter().useImages(environmentId);
}

export function useNodeVolumes(environmentId?: string) {
    return useAdapter().useVolumes(environmentId);
}

export function useNodeNetworks(environmentId?: string) {
    return useAdapter().useNetworks(environmentId);
}

export function useNodeResource<T>(url: string | null): ResourceResult<T> {
    return useAdapter().useResource<T>(url);
}
