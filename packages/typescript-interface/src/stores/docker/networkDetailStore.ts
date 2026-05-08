import { Network } from '../../docker/docker.network';

export interface NetworkDetailState {
    networkId: string | null;
    network: Network | null;
    notFound: boolean;
    isConnecting: boolean;
    isMonitoring: boolean;
    error: Error | null;
    lastUpdate: number | null;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;
    connect: (params: { networkId: string }) => void;
    disconnect: () => void;
}
