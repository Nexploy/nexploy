import { auth } from '@/lib/auth/auth';

async function generateDockerApiKey(userId: string) {
    try {
        console.log('Creating API key for docker-api service...');

        const apiKey = await auth.api.createApiKey({
            body: {
                name: 'docker-api-internal-key',
                userId,
                prefix: 'docker-api',
                rateLimitEnabled: false,
                metadata: {
                    service: 'docker-api',
                    internal: true,
                },
            },
        });

        console.log('\n✅ API Key created successfully!\n');
        console.log('Key ID:', apiKey.id);
        console.log('Key:', apiKey.key);
        console.log('\n⚠️  IMPORTANT: Save this key now! It will not be shown again.');
        console.log('\nAdd this to your docker-api .env file:');
        console.log(`INTERNAL_API_KEY=${apiKey.key}`);
    } catch (error) {
        console.error('❌ Failed to create API key:', error);
        process.exit(1);
    }
}

const userId = process.argv[2];

if (!userId) {
    console.error('❌ Error: User ID is required');
    console.log('\nUsage:');
    console.log('  pnpm tsx scripts/generate-docker-api-key.ts <userId>');
    console.log('\nExample:');
    console.log('  pnpm tsx scripts/generate-docker-api-key.ts cm123abc');
    process.exit(1);
}

generateDockerApiKey(userId);
