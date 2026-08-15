import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

export const FALLBACK_DAYJS_LOCALE = 'en';

const localeLoaders = new Map<string, Promise<void>>();

export function loadDayjsLocale(locale: string): Promise<void> {
    if (locale === FALLBACK_DAYJS_LOCALE) return Promise.resolve();

    let loader = localeLoaders.get(locale);
    if (!loader) {
        loader = import(`dayjs/locale/${locale}`).then(
            () => undefined,
            () => undefined,
        );
        localeLoaders.set(locale, loader);
    }

    return loader;
}

export { dayjs };
export default dayjs;
