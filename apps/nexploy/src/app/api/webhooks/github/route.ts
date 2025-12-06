import { NextRequest, NextResponse } from 'next/server';
import {
    parseGitHubWebhook,
    verifyGitHubSignature,
} from '@/services/webhook/github.webhook.service';
import { startBuildRepositoryInngest } from '@/services/inngest/build.inngest.service';
import { findRepositoryByWebhook } from '@/services/webhook/webhook.service';

export async function POST(request: NextRequest) {
    try {
        const event = request.headers.get('x-github-event');
        const signature = request.headers.get('x-hub-signature-256');

        if (event === 'ping') {
            return NextResponse.json({ message: 'pong' });
        }

        if (event !== 'push') {
            return NextResponse.json({ message: 'Event ignored', event });
        }

        const rawPayload = await request.text();
        const payload = JSON.parse(rawPayload);
        const parsed = parseGitHubWebhook(payload);

        if (!parsed) {
            return NextResponse.json({ message: 'Not a branch push, ignored' });
        }

        const repo = await findRepositoryByWebhook(parsed.repositoryUrl);

        if (!repo) {
            return NextResponse.json({ message: 'Repository not found' }, { status: 404 });
        }

        if (
            repo.webhookSecret &&
            !verifyGitHubSignature(rawPayload, signature, repo.webhookSecret)
        ) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        await startBuildRepositoryInngest(repo.id, repo.webhookSecret!);

        return NextResponse.json({ message: 'Build started' });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
