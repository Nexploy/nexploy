import { useEnvironmentStore } from '@/stores/docker/useEnvironmentStore';
import { usePublicIp } from '@/hooks/usePublicIp';
import { isRoutableHost } from '@/utils/containerPortAccess';

export function useHostAddress() {
    const environments = useEnvironmentStore((state) => state.environments);
    const selectedEnvironmentId = useEnvironmentStore((state) => state.selectedEnvironmentId);

    const environment = environments.find((item) => item.id === selectedEnvironmentId);
    const environmentHost =
        environment?.connectionType !== 'UNIX_SOCKET' && isRoutableHost(environment?.host) ? environment?.host : null;

    const { ip, isLoading, error } = usePublicIp(!environmentHost);

    return {
        host: environmentHost ?? ip ?? null,
        isLoading: !environmentHost && isLoading,
        error: environmentHost ? undefined : error,
    };
}
