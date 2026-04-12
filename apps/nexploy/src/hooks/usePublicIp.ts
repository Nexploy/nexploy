import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';

interface PublicIpResponse {
    ip: string;
}

export function usePublicIp() {
    const { data, isLoading, error, mutate } = useSWR<PublicIpResponse>(
        '/api/network/public-ip',
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
