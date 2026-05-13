import { useContainerStore } from '@/stores/docker/useContainerStore';

export function useIsSwarmContainer() {
    return useContainerStore(
        (state) => !!state.container?.labels?.['com.docker.swarm.service.id'],
    );
}
