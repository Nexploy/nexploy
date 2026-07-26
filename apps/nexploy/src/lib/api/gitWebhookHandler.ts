import { NextResponse } from 'next/server';
import { GitProviderType } from 'generated/client';
import { getGitAdapter } from '@/services/git/core/registry';
import { findRepositoryByWebhook } from '@/services/webhook/webhook.service';
import { startBuildRepository } from '@/services/repository/build.service';

export async function handleGitWebhook(request: Request, provider: GitProviderType) {
    try {
        const adapter = getGitAdapter(provider);
        const event = request.headers.get(adapter.webhookEventHeader);

        const rawBody = await request.text();
        const payload = JSON.parse(rawBody);

        const parsed = adapter.parseWebhookPayload(payload, event);

        if (!parsed) {
            return NextResponse.json({ message: 'Event ignored', event });
        }

        const repo = await findRepositoryByWebhook(parsed.repositoryUrl);

        if (!repo) {
            return NextResponse.json({ message: 'Repository not found' }, { status: 404 });
        }

        if (
            !repo.webhookSecret ||
            !adapter.verifyWebhookSignature({
                headers: request.headers,
                rawBody,
                secret: repo.webhookSecret,
            })
        ) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!repo.userId) {
            return NextResponse.json(
                { message: 'No Git account linked to this repository' },
                { status: 409 },
            );
        }

        const build = await startBuildRepository(
            {
                repositoryId: repo.id,
                branch: parsed.branch,
            },
            repo.userId,
            'webhook',
            undefined,
            {
                event: parsed.event,
                targetBranch: parsed.targetBranch,
                tagName: parsed.tagName,
                mergeRequestAction: parsed.mergeRequestAction,
            },
        );

        if (!build) {
            return NextResponse.json({ message: 'Event filtered out by pipeline configuration' });
        }

        return NextResponse.json({ message: 'Build started' });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
