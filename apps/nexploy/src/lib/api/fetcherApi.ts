import ky, { HTTPError } from 'ky';
import { toast } from 'sonner';
import { clientT } from '@/lib/i18n/clientTranslations';

export type FetcherApiOptions = { url: string; disableToast?: boolean; signal?: AbortSignal };

export const isAbortError = (error: unknown): boolean => (error as { name?: string } | null)?.name === 'AbortError';

export const fetcherApi = async <T>({ url, disableToast, signal }: FetcherApiOptions): Promise<T> => {
    try {
        return await ky.get(url, { signal }).json<T>();
    } catch (err) {
        if (isAbortError(err)) throw err;

        let errorMessage = clientT('toasts.fetchError');
        if (err instanceof HTTPError) {
            try {
                const body = await err.response.json();
                if (body?.error) errorMessage = body.error;
            } catch {}
        }
        if (!disableToast) toast.error(errorMessage);
        throw new Error(errorMessage);
    }
};
