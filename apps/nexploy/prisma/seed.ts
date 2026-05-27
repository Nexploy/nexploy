import { auth } from '@/lib/auth/auth';
import { getPrismaClient } from './getPrismaClient';

const prisma = getPrismaClient();

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

async function seedDockerApiKey() {
    await prisma.apikey.deleteMany({
        where: { name: DOCKER_API_KEY_NAME },
    });

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

    console.log('');
    console.log('='.repeat(60));
    console.log('Docker API Key created successfully!');
    console.log('='.repeat(60));
    console.log('');
    console.log(`NEXPLOY_API_KEY=${apiKey.key}`);
    console.log('');
    console.log('='.repeat(60));
    console.log('');
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
