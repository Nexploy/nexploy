import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';

interface PublicIpResponse {
    ip: string;
}

export function usePublicIp(enabled = true) {
    const { data, isLoading, error, mutate } = useSWR<PublicIpResponse>(
        enabled ? { url: '/api/network/public-ip', disableToast: true } : null,
        fetcherApi,
        { revalidateOnFocus: false },
    );

    return {
        ip: data?.ip,
        isLoading,
        error,
        mutate,
    };
}
