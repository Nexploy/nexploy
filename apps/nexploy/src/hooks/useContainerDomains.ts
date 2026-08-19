import useSWR from 'swr';
import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import { fetcherApi } from '@/lib/api/fetcherApi';

export function useContainerDomains(containerName?: string | null) {
    const key = containerName
        ? { url: `/api/domains?containerName=${encodeURIComponent(containerName)}`, disableToast: true }
        : null;

    const { data, isLoading, error } = useSWR<Domain[]>(key, fetcherApi, { revalidateOnFocus: false });

    return {
        domains: data ?? [],
        isLoading,
        error,
    };
}
