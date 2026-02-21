'use client';

import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Activity,
    ArrowLeft,
    BarChart,
    Cloud,
    Code,
    Cpu,
    Database,
    Download,
    Info,
    LayoutList,
    LineChart,
    MessageSquare,
    Mountain,
    Terminal,
    Workflow,
} from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { onImagePullAction } from '@/actions/docker/image/imagePullAction.action';
import { imagePullSchema } from '@workspace/schemas-zod/docker/image/imagePullAction.schema';
import { Alert, AlertTitle } from '@workspace/ui/components/alert';
import { toast } from 'sonner';
import { cn } from '@workspace/ui/lib/utils';
import { useTranslations } from 'next-intl';
import { LucideIcon } from 'lucide-react';

interface SuggestedImage {
    name: string;
    title: string;
    descriptionKey: string;
    icon: LucideIcon;
    category: string;
}

const SUGGESTED_IMAGES: SuggestedImage[] = [
    { name: 'postgres:latest', title: 'PostgreSQL', descriptionKey: 'postgres', icon: Database, category: 'Database' },
    { name: 'redis:latest', title: 'Redis', descriptionKey: 'redis', icon: Database, category: 'Cache' },
    { name: 'mongo:latest', title: 'MongoDB', descriptionKey: 'mongo', icon: Database, category: 'Database' },
    { name: 'mysql:latest', title: 'MySQL', descriptionKey: 'mysql', icon: Database, category: 'Database' },
    { name: 'minio/minio:latest', title: 'MinIO', descriptionKey: 'minio', icon: Cloud, category: 'Storage' },
    { name: 'rabbitmq:latest', title: 'RabbitMQ', descriptionKey: 'rabbitmq', icon: MessageSquare, category: 'Messaging' },
    { name: 'kibana:latest', title: 'Kibana', descriptionKey: 'kibana', icon: BarChart, category: 'Analytics' },
    { name: 'grafana/grafana:latest', title: 'Grafana', descriptionKey: 'grafana', icon: LineChart, category: 'Monitoring' },
    { name: 'prom/prometheus:latest', title: 'Prometheus', descriptionKey: 'prometheus', icon: Activity, category: 'Monitoring' },
    { name: 'node:latest', title: 'Node.js', descriptionKey: 'node', icon: Code, category: 'Runtime' },
    { name: 'python:latest', title: 'Python', descriptionKey: 'python', icon: Code, category: 'Runtime' },
    { name: 'golang:latest', title: 'Golang', descriptionKey: 'golang', icon: Code, category: 'Runtime' },
    { name: 'busybox:latest', title: 'BusyBox', descriptionKey: 'busybox', icon: Terminal, category: 'Utility' },
    { name: 'alpine:latest', title: 'Alpine', descriptionKey: 'alpine', icon: Mountain, category: 'Base Image' },
    { name: 'ubuntu:latest', title: 'Ubuntu', descriptionKey: 'ubuntu', icon: Cpu, category: 'Base Image' },
    { name: 'n8nio/n8n:latest', title: 'N8N', descriptionKey: 'n8n', icon: Workflow, category: 'Automation' },
];

export default function AddImagePage() {
    const t = useTranslations('docker.pullImagePage');
    const router = useRouter();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onImagePullAction,
        zodResolver(imagePullSchema),
        {
            formProps: {
                defaultValues: {
                    imageName: '',
                },
            },
            actionProps: {
                onExecute: ({ input }) => {
                    toast.loading(t('downloadingImage', { name: input.imageName }));
                },
                onSettled: () => {
                    toast.dismiss();
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    const handleSelectImage = (imageName: string) => {
        form.setValue('imageName', imageName);
    };

    return (
        <div className="flex flex-1 flex-col overflow-hidden pt-5">
            <Form {...form}>
                <form
                    className={'flex flex-1 flex-col overflow-hidden'}
                    onSubmit={handleSubmitWithAction}
                >
                    <div className="flex justify-between gap-4 px-5">
                        <div className="flex gap-3">
                            <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                                <LayoutList className="text-primary size-7" />
                            </div>
                            <div>
                                <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                    {t('title')}
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    {t('description')}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isSubmitting}
                            >
                                <ArrowLeft />
                                {t('back')}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                <Download />
                                {isSubmitting ? t('downloading') : t('downloadButton')}
                            </Button>
                        </div>
                    </div>

                    <Alert variant={'info'} className={'mx-5 mt-5 mb-4 w-auto'}>
                        <Info />
                        <AlertTitle>
                            {t('rateLimitInfo')}
                        </AlertTitle>
                    </Alert>

                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className="space-y-4 overflow-hidden px-5 pb-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('configuration')}</CardTitle>
                                    <CardDescription>
                                        {t('configDescription')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="imageName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('imageName')}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder={t('imageNamePlaceholder')} />
                                                </FormControl>
                                                <FormMessage />
                                                <FormDescription>
                                                    {t('imageNameDescription')}
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('popularImages')}</CardTitle>
                                    <CardDescription>
                                        {t('popularImagesDescription')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                                        {SUGGESTED_IMAGES.map((image) => {
                                            const isSelected =
                                                form.watch('imageName') === image.name;

                                            return (
                                                <Card
                                                    className={cn(
                                                        'hover:border-primary flex cursor-pointer flex-col gap-3 rounded-lg border p-4 transition-all disabled:cursor-not-allowed disabled:opacity-50',
                                                        isSelected && 'border-primary/70',
                                                    )}
                                                    onClick={() => handleSelectImage(image.name)}
                                                    key={image.title}
                                                >
                                                    <CardHeader className={'px-0'}>
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
                                                            <h3 className="text-sm font-semibold">
                                                                {image.title}
                                                            </h3>
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
                        </div>
                    </ScrollAreaWithShadow>
                </form>
            </Form>
        </div>
    );
}
