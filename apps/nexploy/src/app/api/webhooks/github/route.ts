import { NextResponse } from 'next/server';
import { parseGitHubWebhook } from '@/services/webhook/github.webhook.service';
import { startBuildRepositoryInngest } from '@/services/inngest/build.inngest.service';
import { findRepositoryByWebhook } from '@/services/webhook/webhook.service';
import { route } from '@/lib/api/nextRoute';

export const POST = route.handler(async (request: Request, { body }) => {
    try {
        const event = request.headers.get('x-github-event');

        if (event === 'ping') {
            return NextResponse.json({ message: 'pong' });
        }

        if (event !== 'push') {
            return NextResponse.json({ message: 'Event ignored', event });
        }

        const parsed = parseGitHubWebhook(body);

        if (!parsed) {
            return NextResponse.json({ message: 'Not a branch push, ignored' });
        }

        const repo = await findRepositoryByWebhook(parsed.repositoryUrl);

        if (!repo) {
            return NextResponse.json({ message: 'Repository not found' }, { status: 404 });
        }

        await startBuildRepositoryInngest(
            {
                repositoryId: repo.id,
                branch: parsed.branch,
                commitHash: parsed.commitHash,
            },
            repo.userId,
        );

        return NextResponse.json({ message: 'Build started' });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
});
