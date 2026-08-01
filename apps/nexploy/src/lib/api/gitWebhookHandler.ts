import { NextResponse } from 'next/server';
import { GitProviderType } from 'generated/client';
import { getGitAdapter } from '@/services/git/core/registry';
import { findRepositoriesByWebhook } from '@/services/webhook/webhook.service';
import { startBuildRepository } from '@/services/repository/build.service';

export async function handleGitWebhook(request: Request, provider: GitProviderType) {
    try {
        const adapter = getGitAdapter(provider);
        const event = request.headers.get(adapter.webhookEventHeader);
        const repositoryId = new URL(request.url).searchParams.get('repositoryId');

        const rawBody = await request.text();
        const payload = JSON.parse(rawBody);

        const parsed = adapter.parseWebhookPayload(payload, event);

        if (!parsed) {
            return NextResponse.json({ message: 'Event ignored', event });
        }

        const repositories = await findRepositoriesByWebhook(parsed.repositoryUrl, repositoryId);

        if (repositories.length === 0) {
            return NextResponse.json({ message: 'Repository not found' }, { status: 404 });
        }

        const authenticated = repositories.filter(
            (repo) =>
                repo.webhookSecret &&
                adapter.verifyWebhookSignature({
                    headers: request.headers,
                    rawBody,
                    secret: repo.webhookSecret,
                }),
        );

        if (authenticated.length === 0) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const linked = authenticated.filter((repo) => repo.userId);

        if (linked.length === 0) {
            return NextResponse.json({ message: 'No Git account linked to this repository' }, { status: 409 });
        }

        const results = await Promise.all(
            linked.map(async (repo) => {
                try {
                    const build = await startBuildRepository(
                        {
                            repositoryId: repo.id,
                            branch: parsed.branch,
                        },
                        repo.userId as string,
                        'webhook',
                        undefined,
                        {
                            event: parsed.event,
                            targetBranch: parsed.targetBranch,
                            tagName: parsed.tagName,
                            mergeRequestAction: parsed.mergeRequestAction,
                        },
                    );

                    return {
                        repositoryId: repo.id,
                        organizationId: repo.organizationId,
                        started: !!build,
                    };
                } catch {
                    return {
                        repositoryId: repo.id,
                        organizationId: repo.organizationId,
                        started: false,
                    };
                }
            }),
        );

        const startedCount = results.filter((result) => result.started).length;

        if (startedCount === 0) {
            return NextResponse.json({
                message: 'Event filtered out by pipeline configuration',
                repositories: results,
            });
        }

        return NextResponse.json({
            message: 'Build started',
            startedCount,
            repositories: results,
        });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
