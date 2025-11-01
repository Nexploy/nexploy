import { Network } from '../docker/docker.network';

export interface NetworkState {
    networks: Network[];
    error: Error | null;
    lastUpdate: number | null;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;
    setNetworks: (networks: Network[]) => void;
    setError: (error: Error | null) => void;
    setLastUpdate: (timestamp: number) => void;
    addNetwork: (network: Network) => void;
    removeNetwork: (networkId: string) => void;
    updateNetwork: (network: Network) => void;
    getNetwork: (id: string) => Network | undefined;
    getNetworkByName: (name: string) => Network | undefined;
    getNetworksByDriver: (driver: string) => Network[];
    getConnectedNetworks: (containerId: string) => Network[];
    getOrganizedNetworks: () => {
        byDriver: Map<string, Network[]>;
        builtin: Network[];
        custom: Network[];
    };
    connect: (networkIds?: string[]) => void;
    disconnect: () => void;
}
