import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { locales } from '@workspace/i18n';
import { builtinNodeMessages, mergeMessages, type MessageTree } from '@/pipeline-nodes/registry/messages';

export default getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;
    const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

    const base = locales[locale as keyof typeof locales];
    const nodeMessages = builtinNodeMessages[locale] ?? builtinNodeMessages[routing.defaultLocale] ?? {};

    const messages = {
        ...base,
        repository: {
            ...base.repository,
            pipeline: mergeMessages([base.repository.pipeline as unknown as MessageTree, nodeMessages]),
        },
    };

    return {
        locale,
        messages,
    };
});
