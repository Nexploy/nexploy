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
import { ImagePullSchema } from '@workspace/schemas-zod/image/imagePullAction.schema';
import { Alert, AlertTitle } from '@workspace/ui/components/alert';
import { toast } from 'sonner';
import { cn } from '@workspace/ui/lib/utils';

const SUGGESTED_IMAGES = [
    {
        name: 'postgres:latest',
        title: 'PostgreSQL',
        description: 'Base de données relationnelle open source',
        icon: Database,
        category: 'Database',
    },
    {
        name: 'redis:latest',
        title: 'Redis',
        description: 'Base de données en mémoire pour caching et messagerie',
        icon: Database,
        category: 'Cache',
    },
    {
        name: 'mongo:latest',
        title: 'MongoDB',
        description: 'Base de données NoSQL orientée documents',
        icon: Database,
        category: 'Database',
    },
    {
        name: 'mysql:latest',
        title: 'MySQL',
        description: 'Base de données relationnelle populaire',
        icon: Database,
        category: 'Database',
    },
    {
        name: 'minio/minio:latest',
        title: 'MinIO',
        description: 'Stockage objet compatible S3',
        icon: Cloud,
        category: 'Storage',
    },
    {
        name: 'rabbitmq:latest',
        title: 'RabbitMQ',
        description: 'Système de messagerie et broker AMQP',
        icon: MessageSquare,
        category: 'Messaging',
    },
    {
        name: 'kibana:latest',
        title: 'Kibana',
        description: 'Interface d’analyse et visualisation pour Elasticsearch',
        icon: BarChart,
        category: 'Analytics',
    },
    {
        name: 'grafana/grafana:latest',
        title: 'Grafana',
        description: 'Plateforme de surveillance et tableaux de bord',
        icon: LineChart,
        category: 'Monitoring',
    },
    {
        name: 'prom/prometheus:latest',
        title: 'Prometheus',
        description: 'Système de monitoring et d’alerte pour applications',
        icon: Activity,
        category: 'Monitoring',
    },
    {
        name: 'node:latest',
        title: 'Node.js',
        description: 'Environnement d’exécution JavaScript côté serveur',
        icon: Code,
        category: 'Runtime',
    },
    {
        name: 'python:latest',
        title: 'Python',
        description: 'Langage de programmation polyvalent',
        icon: Code,
        category: 'Runtime',
    },
    {
        name: 'golang:latest',
        title: 'Golang',
        description: 'Langage compilé rapide pour backend et systèmes',
        icon: Code,
        category: 'Runtime',
    },
    {
        name: 'busybox:latest',
        title: 'BusyBox',
        description: 'Petite suite d’outils Unix pour conteneurs légers',
        icon: Terminal,
        category: 'Utility',
    },
    {
        name: 'alpine:latest',
        title: 'Alpine',
        description: 'Image Linux minimaliste pour conteneurs',
        icon: Mountain,
        category: 'Base Image',
    },
    {
        name: 'ubuntu:latest',
        title: 'Ubuntu',
        description: 'Distribution Linux populaire et stable',
        icon: Cpu,
        category: 'Base Image',
    },
    {
        name: 'n8nio/n8n:latest',
        title: 'N8N',
        description: "Plateforme d'automatisation de workflows",
        icon: Workflow,
        category: 'Automation',
    },
];

export default function AddImagePage() {
    const router = useRouter();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onImagePullAction,
        zodResolver(ImagePullSchema),
        {
            formProps: {
                defaultValues: {
                    imageName: '',
                },
            },
            actionProps: {
                onExecute: ({ input }) => {
                    toast.loading(`Téléchargement de l'image ${input.imageName} en cours...`);
                },
                onError: ({ error }) => {
                    toast.error(error.validationErrors?._errors);
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
                    <div className="flex justify-between gap-4 px-6">
                        <div className="flex gap-3">
                            <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                                <LayoutList className="text-primary size-7" />
                            </div>
                            <div>
                                <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                    Nouvelle image
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    Télécharger une nouvelle image Docker
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
                                Retour
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                <Download />
                                {isSubmitting ? 'Téléchargement...' : "Télécharger l'image"}
                            </Button>
                        </div>
                    </div>

                    <Alert variant={'info'} className={'mx-6 mt-5 mb-4 w-auto'}>
                        <Info />
                        <AlertTitle>
                            Jusqu'à 100 pulls par période de 6 heures en anonyme via Docker Hub
                        </AlertTitle>
                    </Alert>

                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className="space-y-4 overflow-hidden px-6 pb-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Configuration</CardTitle>
                                    <CardDescription>
                                        Saisissez le nom d'une image Docker spécifique
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="imageName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nom de l'image</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="image:tag" />
                                                </FormControl>
                                                <FormMessage />
                                                <FormDescription>
                                                    Le nom de l'image Docker à télécharger (ex:
                                                    nginx:latest, postgres:15, redis:alpine)
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Images populaires</CardTitle>
                                    <CardDescription>
                                        Sélectionnez une image parmi nos suggestions
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
                                                        'hover:border-primary hover:bg-accent/50 flex cursor-pointer flex-col gap-3 rounded-lg border p-4 transition-all disabled:cursor-not-allowed disabled:opacity-50',
                                                        isSelected && 'border-primary bg-accent/20',
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
                                                                {image.description}
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
