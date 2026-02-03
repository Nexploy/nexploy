import { toast } from 'sonner';
import { toastT } from '@/lib/i18n/toastTranslations';

export const fetcherApi = async <T>(...args: Parameters<typeof fetch>): Promise<T> => {
    const res = await fetch(...args);

    if (!res.ok) {
        toast.error(toastT('toasts.fetchError'));
        throw new Error(toastT('toasts.fetchError'));
    }

    return (await res.json()) as Promise<T>;
};
