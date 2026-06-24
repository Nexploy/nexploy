import type {
    DockerHubImage,
    DockerHubRawResponse,
    DockerHubSearchOptions,
} from '@workspace/typescript-interface/docker/docker.hub';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

const DOCKER_HUB_SEARCH_URL = 'https://hub.docker.com/api/search/v3/catalog/search';

export async function searchDockerHubImages(
    query: string,
    { sort = 'pull_count', size = 30, from = 0 }: DockerHubSearchOptions = {},
): Promise<DockerHubImage[]> {
    const t = await getErrorTranslator();
    const term = query.trim();

    const params = new URLSearchParams({
        query: term,
        from: `${from}`,
        size: `${size}`,
    });

    if (sort === 'pull_count' || !term) {
        params.set('sort', 'pull_count');
        params.set('order', 'desc');
    }

    const url = `${DOCKER_HUB_SEARCH_URL}?${params.toString()}`;

    const res = await fetch(url, {
        headers: { 'Search-Version': 'v3' },
        next: { revalidate: 60 },
    });

    if (!res.ok) {
        throw new Error(t('dockerHub.searchFailed', { status: res.status }));
    }

    const data = (await res.json()) as DockerHubRawResponse;

    return (data.results ?? [])
        .filter((r) => r.type === 'image')
        .map((r) => {
            const repo = r.rate_plans?.[0]?.repositories?.[0];
            return {
                name: r.name,
                slug: r.slug,
                description: r.short_description ?? '',
                logoUrl: r.logo_url?.small ?? r.logo_url?.large ?? null,
                starCount: r.star_count ?? 0,
                pullCount: repo?.pull_count ?? null,
                isOfficial: repo?.is_official ?? false,
                publisher: r.publisher?.name ?? null,
            } satisfies DockerHubImage;
        });
}
