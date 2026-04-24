import { toast } from 'sonner';
import { toastT } from '@/lib/i18n/toastTranslations';

export type FetcherApiOptions = { url: string; disableToast?: boolean };

export const fetcherApi = async <T>({ url, disableToast }: FetcherApiOptions): Promise<T> => {
    const res = await fetch(url);

    if (!res.ok) {
        if (!disableToast) toast.error(toastT('toasts.fetchError'));
        throw new Error(toastT('toasts.fetchError'));
    }

    return (await res.json()) as Promise<T>;
};
