import { getPrismaClient } from './getPrismaClient';
import { createSeedAuth } from './seedAuth';
import { decrypt, encrypt } from '@/lib/encryption.ts';

const prisma = getPrismaClient();
const auth = createSeedAuth(prisma);

const DOCKER_API_USER_ID = 'docker-api-system';
const DOCKER_API_KEY_NAME = 'docker-api';

async function seedEnvironment() {
    const existingDefault = await prisma.environment.findFirst({
        where: { isDefault: true },
    });

    if (existingDefault) {
        console.log('Default environment already exists:', existingDefault.name);
        return;
    }

    const defaultEnvironment = await prisma.environment.create({
        data: {
            name: 'Local Docker',
            connectionType: 'UNIX_SOCKET',
            socketPath: '/var/run/docker.sock',
            isDefault: true,
            isActive: true,
            userId: null,
            description: 'Default local Docker environment using Unix socket',
        },
    });

    console.log('Created default environment:', defaultEnvironment.name);
}

function printDockerApiKey(plainKey: string) {
    console.log('');
    console.log('='.repeat(60));
    console.log('Docker API Key');
    console.log('='.repeat(60));
    console.log('');
    console.log(`NEXPLOY_API_KEY=${plainKey}`);
    console.log('');
    console.log('='.repeat(60));
    console.log('');
}

async function seedDockerApiKey() {
    const existing = await prisma.apikey.findFirst({
        where: { name: DOCKER_API_KEY_NAME },
    });

    if (existing) {
        const metadata = existing.metadata ? JSON.parse(existing.metadata) : {};
        const encryptedKey = metadata.encryptedKey as string | undefined;

        if (!encryptedKey) {
            throw new Error(
                'Docker API key exists but its encrypted value is missing. ' +
                    'Delete the "docker-api" row in the apikey table to force regeneration.',
            );
        }

        console.log('Docker API key already exists, reusing it.');
        printDockerApiKey(decrypt(encryptedKey));
        return;
    }

    let systemUser = await prisma.user.findUnique({
        where: { id: DOCKER_API_USER_ID },
    });

    if (!systemUser) {
        systemUser = await prisma.user.create({
            data: {
                id: DOCKER_API_USER_ID,
                name: 'Docker API System',
                email: 'docker-api@nexploy.local',
                emailVerified: true,
                role: 'system',
            },
        });
        console.log('Created system user:', systemUser.name);
    }

    const apiKey = await auth.api.createApiKey({
        body: {
            name: DOCKER_API_KEY_NAME,
            userId: DOCKER_API_USER_ID,
            prefix: 'nxp_',
            rateLimitEnabled: false,
            metadata: {
                service: 'docker-api',
                description: 'Internal API key for docker-api service',
            },
        },
    });

    await prisma.apikey.update({
        where: { id: apiKey.id },
        data: {
            metadata: JSON.stringify({
                service: 'docker-api',
                description: 'Internal API key for docker-api service',
                encryptedKey: encrypt(apiKey.key),
            }),
        },
    });

    console.log('Docker API key created successfully!');
    printDockerApiKey(apiKey.key);
}

async function main() {
    console.log('Seeding database...');
    console.log('');

    await seedDockerApiKey();
    await seedEnvironment();

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
