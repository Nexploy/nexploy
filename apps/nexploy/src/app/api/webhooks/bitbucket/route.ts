import { handleGitWebhook } from '@/lib/api/gitWebhookHandler';

export async function POST(request: Request) {
    return handleGitWebhook(request, 'BITBUCKET');
}
