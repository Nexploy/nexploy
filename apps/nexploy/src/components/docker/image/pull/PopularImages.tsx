'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import {
    Activity,
    BarChart,
    Cloud,
    Code,
    Cpu,
    Database,
    LineChart,
    LucideIcon,
    MessageSquare,
    Mountain,
    Star,
    Terminal,
    Workflow,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card';
import { cn } from '@workspace/ui/lib/utils';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';

interface SuggestedImage {
    name: string;
    title: string;
    descriptionKey: string;
    icon: LucideIcon;
    category: string;
}

const SUGGESTED_IMAGES: SuggestedImage[] = [
    {
        name: 'postgres:latest',
        title: 'PostgreSQL',
        descriptionKey: 'postgres',
        icon: Database,
        category: 'Database',
    },
    {
        name: 'redis:latest',
        title: 'Redis',
        descriptionKey: 'redis',
        icon: Database,
        category: 'Cache',
    },
    {
        name: 'mongo:latest',
        title: 'MongoDB',
        descriptionKey: 'mongo',
        icon: Database,
        category: 'Database',
    },
    {
        name: 'mysql:latest',
        title: 'MySQL',
        descriptionKey: 'mysql',
        icon: Database,
        category: 'Database',
    },
    {
        name: 'minio/minio:latest',
        title: 'MinIO',
        descriptionKey: 'minio',
        icon: Cloud,
        category: 'Storage',
    },
    {
        name: 'rabbitmq:latest',
        title: 'RabbitMQ',
        descriptionKey: 'rabbitmq',
        icon: MessageSquare,
        category: 'Messaging',
    },
    {
        name: 'kibana:latest',
        title: 'Kibana',
        descriptionKey: 'kibana',
        icon: BarChart,
        category: 'Analytics',
    },
    {
        name: 'grafana/grafana:latest',
        title: 'Grafana',
        descriptionKey: 'grafana',
        icon: LineChart,
        category: 'Monitoring',
    },
    {
        name: 'prom/prometheus:latest',
        title: 'Prometheus',
        descriptionKey: 'prometheus',
        icon: Activity,
        category: 'Monitoring',
    },
    {
        name: 'node:latest',
        title: 'Node.js',
        descriptionKey: 'node',
        icon: Code,
        category: 'Runtime',
    },
    {
        name: 'python:latest',
        title: 'Python',
        descriptionKey: 'python',
        icon: Code,
        category: 'Runtime',
    },
    {
        name: 'golang:latest',
        title: 'Golang',
        descriptionKey: 'golang',
        icon: Code,
        category: 'Runtime',
    },
    {
        name: 'busybox:latest',
        title: 'BusyBox',
        descriptionKey: 'busybox',
        icon: Terminal,
        category: 'Utility',
    },
    {
        name: 'alpine:latest',
        title: 'Alpine',
        descriptionKey: 'alpine',
        icon: Mountain,
        category: 'Base Image',
    },
    {
        name: 'ubuntu:latest',
        title: 'Ubuntu',
        descriptionKey: 'ubuntu',
        icon: Cpu,
        category: 'Base Image',
    },
    {
        name: 'n8nio/n8n:latest',
        title: 'N8N',
        descriptionKey: 'n8n',
        icon: Workflow,
        category: 'Automation',
    },
];

export function PopularImages() {
    const t = useTranslations('docker.pullImagePage');
    const form = useFormContext();

    const handleSelectImage = (imageName: string) => {
        form.setValue('imageName', imageName);
    };

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Star}
                title={t('popularImages')}
                description={t('popularImagesDescription')}
            />
            <CardContent>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {SUGGESTED_IMAGES.map((image) => {
                        const isSelected = form.watch('imageName') === image.name;

                        return (
                            <Card
                                key={image.title}
                                className={cn(
                                    'hover:border-primary flex cursor-pointer flex-col gap-3 rounded-lg border p-4 transition-all disabled:cursor-not-allowed disabled:opacity-50',
                                    isSelected && 'border-primary/70',
                                )}
                                onClick={() => handleSelectImage(image.name)}
                            >
                                <CardHeader className="px-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-md">
                                            <image.icon className="text-primary size-5" />
                                        </div>
                                        <span className="text-muted-foreground bg-muted rounded px-2 py-1 text-xs">
                                            {image.category}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-2 px-0">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-semibold">{image.title}</h3>
                                        <p className="text-muted-foreground line-clamp-2 text-xs">
                                            {t(`images.${image.descriptionKey}`)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
