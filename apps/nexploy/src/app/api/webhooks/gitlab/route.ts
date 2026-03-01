import { NextResponse } from 'next/server';
import {
    parseGitLabWebhook,
    verifyGitLabWebhookToken,
} from '@/services/webhook/gitlab.webhook.service';
import { startBuildRepositoryInngest } from '@/services/inngest/build.inngest.service';
import { findRepositoryByWebhook } from '@/services/webhook/webhook.service';
import { route } from '@/lib/api/nextRoute';

export const POST = route.handler(async (request: Request, { body }) => {
    try {
        const gitlabToken = request.headers.get('x-gitlab-token');
        const payload = body;

        if (payload.object_kind !== 'push') {
            return NextResponse.json({ message: 'Event ignored', event: payload.object_kind });
        }

        const parsed = parseGitLabWebhook(payload);

        if (!parsed) {
            return NextResponse.json({ message: 'Not a branch push, ignored' });
        }

        const repo = await findRepositoryByWebhook(parsed.repositoryUrl);

        if (!repo) {
            return NextResponse.json({ message: 'Repository not found' }, { status: 404 });
        }

        if (repo.webhookSecret && !verifyGitLabWebhookToken(gitlabToken, repo.webhookSecret)) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        await startBuildRepositoryInngest(
            {
                repositoryId: repo.id,
            },
            repo.userId,
        );

        return NextResponse.json({ message: 'Build started' });
    } catch (error) {
        console.error('[GitLab Webhook Error]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
});
