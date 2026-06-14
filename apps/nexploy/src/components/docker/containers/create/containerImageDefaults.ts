import type { ContainerCreateForm } from '@workspace/schemas-zod/docker/container/containerCreate.schema';
import type { DockerHubImage } from '@workspace/typescript-interface/docker/docker.hub';

type ImageDefault = Pick<ContainerCreateForm, 'ports' | 'envVars' | 'volumes'>;

/**
 * Curated base configuration (ports / env / volumes) for well-known images.
 * Keyed by the image's base name (the slug's last path segment). Images not
 * listed here just get a minimal config (name + image + restart).
 */
const IMAGE_DEFAULTS: Record<string, ImageDefault> = {
    postgres: {
        ports: [{ hostPort: 5432, containerPort: 5432, protocol: 'tcp' }],
        envVars: [
            { key: 'POSTGRES_USER', value: 'postgres' },
            { key: 'POSTGRES_PASSWORD', value: 'password' },
            { key: 'POSTGRES_DB', value: 'mydb' },
        ],
        volumes: [
            {
                hostPath: 'postgres-data',
                containerPath: '/var/lib/postgresql/data',
                readOnly: false,
            },
        ],
    },
    mysql: {
        ports: [{ hostPort: 3306, containerPort: 3306, protocol: 'tcp' }],
        envVars: [
            { key: 'MYSQL_ROOT_PASSWORD', value: 'rootpassword' },
            { key: 'MYSQL_DATABASE', value: 'mydb' },
            { key: 'MYSQL_USER', value: 'user' },
            { key: 'MYSQL_PASSWORD', value: 'password' },
        ],
        volumes: [{ hostPath: 'mysql-data', containerPath: '/var/lib/mysql', readOnly: false }],
    },
    mariadb: {
        ports: [{ hostPort: 3306, containerPort: 3306, protocol: 'tcp' }],
        envVars: [
            { key: 'MARIADB_ROOT_PASSWORD', value: 'rootpassword' },
            { key: 'MARIADB_DATABASE', value: 'mydb' },
            { key: 'MARIADB_USER', value: 'user' },
            { key: 'MARIADB_PASSWORD', value: 'password' },
        ],
        volumes: [{ hostPath: 'mariadb-data', containerPath: '/var/lib/mysql', readOnly: false }],
    },
    mongo: {
        ports: [{ hostPort: 27017, containerPort: 27017, protocol: 'tcp' }],
        envVars: [
            { key: 'MONGO_INITDB_ROOT_USERNAME', value: 'admin' },
            { key: 'MONGO_INITDB_ROOT_PASSWORD', value: 'password' },
        ],
        volumes: [{ hostPath: 'mongo-data', containerPath: '/data/db', readOnly: false }],
    },
    redis: {
        ports: [{ hostPort: 6379, containerPort: 6379, protocol: 'tcp' }],
        envVars: [],
        volumes: [{ hostPath: 'redis-data', containerPath: '/data', readOnly: false }],
    },
    rabbitmq: {
        ports: [
            { hostPort: 5672, containerPort: 5672, protocol: 'tcp' },
            { hostPort: 15672, containerPort: 15672, protocol: 'tcp' },
        ],
        envVars: [
            { key: 'RABBITMQ_DEFAULT_USER', value: 'guest' },
            { key: 'RABBITMQ_DEFAULT_PASS', value: 'guest' },
        ],
        volumes: [
            { hostPath: 'rabbitmq-data', containerPath: '/var/lib/rabbitmq', readOnly: false },
        ],
    },
    nginx: {
        ports: [{ hostPort: 8080, containerPort: 80, protocol: 'tcp' }],
        envVars: [],
        volumes: [],
    },
    httpd: {
        ports: [{ hostPort: 8080, containerPort: 80, protocol: 'tcp' }],
        envVars: [],
        volumes: [],
    },
    memcached: {
        ports: [{ hostPort: 11211, containerPort: 11211, protocol: 'tcp' }],
        envVars: [],
        volumes: [],
    },
    minio: {
        ports: [
            { hostPort: 9000, containerPort: 9000, protocol: 'tcp' },
            { hostPort: 9001, containerPort: 9001, protocol: 'tcp' },
        ],
        envVars: [
            { key: 'MINIO_ROOT_USER', value: 'minioadmin' },
            { key: 'MINIO_ROOT_PASSWORD', value: 'minioadmin' },
        ],
        volumes: [{ hostPath: 'minio-data', containerPath: '/data', readOnly: false }],
    },
    mongodb: {
        ports: [{ hostPort: 27017, containerPort: 27017, protocol: 'tcp' }],
        envVars: [
            { key: 'MONGO_INITDB_ROOT_USERNAME', value: 'admin' },
            { key: 'MONGO_INITDB_ROOT_PASSWORD', value: 'password' },
        ],
        volumes: [{ hostPath: 'mongo-data', containerPath: '/data/db', readOnly: false }],
    },
};

/** Base name used to look up defaults (e.g. "library/postgres" -> "postgres"). */
function baseName(slug: string): string {
    return slug.includes('/') ? slug.split('/').pop()! : slug;
}

/** Builds a full create-container form config from a selected Docker Hub image. */
export function buildContainerConfig(image: DockerHubImage): ContainerCreateForm {
    const name = baseName(image.slug);
    const defaults = IMAGE_DEFAULTS[name];

    return {
        name,
        image: `${image.slug}:latest`,
        restart: 'unless-stopped',
        networks: [],
        hostname: '',
        autoRemove: false,
        privileged: false,
        ports: defaults?.ports ?? [],
        envVars: defaults?.envVars ?? [],
        volumes: defaults?.volumes ?? [],
        labels: [],
    };
}
