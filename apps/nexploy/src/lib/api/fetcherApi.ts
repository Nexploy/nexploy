import { toast } from 'sonner';
import { clientT } from '@/lib/i18n/clientTranslations';

export type FetcherApiOptions = { url: string; disableToast?: boolean };

export const fetcherApi = async <T>({ url, disableToast }: FetcherApiOptions): Promise<T> => {
    const res = await fetch(url);

    if (!res.ok) {
        let errorMessage = clientT('toasts.fetchError');
        try {
            const body = await res.json();
            if (body?.error) errorMessage = body.error;
        } catch {}
        if (!disableToast) toast.error(errorMessage);
        throw new Error(errorMessage);
    }

    return (await res.json()) as Promise<T>;
};
