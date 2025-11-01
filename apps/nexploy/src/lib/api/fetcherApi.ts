import { toast } from 'sonner';

export const fetcherApi = async <T>(...args: Parameters<typeof fetch>): Promise<T> => {
    const res = await fetch(...args);

    if (!res.ok) {
        toast.error('An error occurred while fetching the data.');
        throw new Error('An error occurred while fetching the data.');
    }

    return (await res.json()) as Promise<T>;
};
