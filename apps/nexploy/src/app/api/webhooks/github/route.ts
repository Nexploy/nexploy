import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { parseGitHubWebhook } from '@/services/webhook/github.webhook.service';
import { startBuildRepository } from '@/services/repository/build.service';
import { findRepositoryByWebhook } from '@/services/webhook/webhook.service';
import { timingSafeEqual } from '@/lib/api/crypto-utils';

export async function POST(request: Request) {
    try {
        const event = request.headers.get('x-github-event');

        if (event === 'ping') {
            return NextResponse.json({ message: 'pong' });
        }

        if (event !== 'push') {
            return NextResponse.json({ message: 'Event ignored', event });
        }

        const rawBody = await request.text();
        const body = JSON.parse(rawBody);

        const parsed = parseGitHubWebhook(body);

        if (!parsed) {
            return NextResponse.json({ message: 'Not a branch push, ignored' });
        }

        const repo = await findRepositoryByWebhook(parsed.repositoryUrl);

        if (!repo) {
            return NextResponse.json({ message: 'Repository not found' }, { status: 404 });
        }

        const signature = request.headers.get('x-hub-signature-256');
        if (!signature || !repo.webhookSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const expected =
            'sha256=' +
            crypto.createHmac('sha256', repo.webhookSecret).update(rawBody).digest('hex');

        if (!timingSafeEqual(signature, expected)) {
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
