import { toast } from 'sonner';
import { clientT } from '@/lib/i18n/clientTranslations';

export type FetcherApiOptions = { url: string; disableToast?: boolean };

export const fetcherApi = async <T>({ url, disableToast }: FetcherApiOptions): Promise<T> => {
    const res = await fetch(url);

    if (!res.ok) {
        if (!disableToast) toast.error(clientT('toasts.fetchError'));
        throw new Error(clientT('toasts.fetchError'));
    }

    return (await res.json()) as Promise<T>;
};
