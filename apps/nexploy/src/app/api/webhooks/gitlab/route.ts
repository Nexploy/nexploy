import { NextResponse } from 'next/server';
import { parseGitLabWebhook } from '@/services/webhook/gitlab.webhook.service';
import { startBuildRepository } from '@/services/repository/build.service';
import { findRepositoryByWebhook } from '@/services/webhook/webhook.service';
import { timingSafeEqual } from '@/lib/api/crypto-utils';

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const payload = JSON.parse(rawBody);

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

        const token = request.headers.get('x-gitlab-token');
        if (!token || !repo.webhookSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!timingSafeEqual(token, repo.webhookSecret)) {
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
