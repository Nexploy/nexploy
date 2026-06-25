import { NextResponse } from 'next/server';
import { startBuildRepository } from '@/services/repository/build.service';
import { findRepositoryByWebhook } from '@/services/webhook/webhook.service';
import { getGitAdapter } from '@/services/git/core/registry';

export async function POST(request: Request) {
    try {
        const event = request.headers.get('x-gitea-event');

        if (event && event !== 'push') {
            return NextResponse.json({ message: 'Event ignored', event });
        }

        const rawBody = await request.text();
        const payload = JSON.parse(rawBody);

        const adapter = getGitAdapter('GITEA');
        const parsed = adapter.parseWebhookPayload(payload);

        if (!parsed) {
            return NextResponse.json({ message: 'Not a branch push, ignored' });
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

        await startBuildRepository(
            {
                repositoryId: repo.id,
                branch: parsed.branch,
            },
            repo.userId,
            'webhook',
        );

        return NextResponse.json({ message: 'Build started' });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
