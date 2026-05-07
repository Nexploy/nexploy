'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { Circle, Database, Database as MySQL, Leaf } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { cn } from '@workspace/ui/lib/utils';

const CONTAINER_TEMPLATES = [
    {
        name: 'PostgreSQL',
        icon: Database,
        descriptionKey: 'templatePostgres' as const,
        categoryKey: 'categoryDatabase' as const,
        config: {
            name: 'postgres',
            image: 'postgres:16',
            restart: 'unless-stopped',
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
    },
    {
        name: 'Redis',
        icon: Circle,
        descriptionKey: 'templateRedis' as const,
        categoryKey: 'categoryCache' as const,
        config: {
            name: 'redis',
            image: 'redis:7-alpine',
            restart: 'unless-stopped',
            ports: [{ hostPort: 6379, containerPort: 6379, protocol: 'tcp' }],
            envVars: [],
            volumes: [{ hostPath: 'redis-data', containerPath: '/data', readOnly: false }],
        },
    },
    {
        name: 'MySQL',
        icon: MySQL,
        descriptionKey: 'templateMysql' as const,
        categoryKey: 'categoryDatabase' as const,
        config: {
            name: 'mysql',
            image: 'mysql:8',
            restart: 'unless-stopped',
            ports: [{ hostPort: 3306, containerPort: 3306, protocol: 'tcp' }],
            envVars: [
                { key: 'MYSQL_ROOT_PASSWORD', value: 'rootpassword' },
                { key: 'MYSQL_DATABASE', value: 'mydb' },
                { key: 'MYSQL_USER', value: 'user' },
                { key: 'MYSQL_PASSWORD', value: 'password' },
            ],
            volumes: [{ hostPath: 'mysql-data', containerPath: '/var/lib/mysql', readOnly: false }],
        },
    },
    {
        name: 'MongoDB',
        icon: Leaf,
        descriptionKey: 'templateMongodb' as const,
        categoryKey: 'categoryDatabase' as const,
        config: {
            name: 'mongodb',
            image: 'mongo:7',
            restart: 'unless-stopped',
            ports: [{ hostPort: 27017, containerPort: 27017, protocol: 'tcp' }],
            envVars: [
                { key: 'MONGO_INITDB_ROOT_USERNAME', value: 'admin' },
                { key: 'MONGO_INITDB_ROOT_PASSWORD', value: 'password' },
            ],
            volumes: [{ hostPath: 'mongo-data', containerPath: '/data/db', readOnly: false }],
        },
    },
] as const;

export function ContainerTemplates() {
    const t = useTranslations('docker.createContainer');
    const form = useFormContext();

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('templates')}</CardTitle>
                <CardDescription>{t('templatesDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {CONTAINER_TEMPLATES.map((template) => (
                    <Card
                        key={template.name}
                        onClick={() => form.reset(template.config)}
                        className={cn(
                            'hover:border-primary flex cursor-pointer flex-col gap-3 rounded-lg border p-4 transition-all disabled:cursor-not-allowed disabled:opacity-50',
                            form.watch('image') === template.config.image && 'border-primary/70',
                        )}
                    >
                        <CardHeader className="px-0">
                            <div className="flex items-start justify-between gap-2">
                                <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-md">
                                    <template.icon className="text-primary size-5" />
                                </div>
                                <span className="text-muted-foreground bg-muted rounded px-2 py-1 text-xs">
                                    {t(template.categoryKey)}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2 px-0">
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold">{template.name}</h3>
                                <p className="text-muted-foreground line-clamp-1 text-xs">
                                    {t(template.descriptionKey)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </CardContent>
        </Card>
    );
}
