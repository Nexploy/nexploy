'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Container, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Switch } from '@workspace/ui/components/switch';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { ScrollAreaWithShadow } from '@/components/docker/ScrollAreaWithShadow';

const containerFormSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    image: z.string().min(1, "L'image est requise"),
    restart: z.enum(['no', 'always', 'on-failure', 'unless-stopped']).default('unless-stopped'),
    network: z.string().optional(),
    hostname: z.string().optional(),
    autoRemove: z.boolean().default(false),
    privileged: z.boolean().default(false),
});

type ContainerFormValues = z.infer<typeof containerFormSchema>;

interface PortMapping {
    hostPort: string;
    containerPort: string;
    protocol: 'tcp' | 'udp';
}

interface EnvVar {
    key: string;
    value: string;
}

interface VolumeMount {
    hostPath: string;
    containerPath: string;
    readOnly: boolean;
}

export default function AddContainerPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [ports, setPorts] = useState<PortMapping[]>([]);
    const [envVars, setEnvVars] = useState<EnvVar[]>([]);
    const [volumes, setVolumes] = useState<VolumeMount[]>([]);

    const form = useForm<ContainerFormValues>({
        resolver: zodResolver(containerFormSchema),
        defaultValues: {
            name: '',
            image: '',
            restart: 'unless-stopped',
            autoRemove: false,
            privileged: false,
        },
    });

    const addPort = () => {
        setPorts([...ports, { hostPort: '', containerPort: '', protocol: 'tcp' }]);
    };

    const removePort = (index: number) => {
        setPorts(ports.filter((_, i) => i !== index));
    };

    const updatePort = (index: number, field: keyof PortMapping, value: string) => {
        const newPorts = [...ports];
        newPorts[index] = { ...newPorts[index], [field]: value };
        setPorts(newPorts);
    };

    const addEnvVar = () => {
        setEnvVars([...envVars, { key: '', value: '' }]);
    };

    const removeEnvVar = (index: number) => {
        setEnvVars(envVars.filter((_, i) => i !== index));
    };

    const updateEnvVar = (index: number, field: keyof EnvVar, value: string) => {
        const newEnvVars = [...envVars];
        newEnvVars[index] = { ...newEnvVars[index], [field]: value };
        setEnvVars(newEnvVars);
    };

    const addVolume = () => {
        setVolumes([...volumes, { hostPath: '', containerPath: '', readOnly: false }]);
    };

    const removeVolume = (index: number) => {
        setVolumes(volumes.filter((_, i) => i !== index));
    };

    const updateVolume = (index: number, field: keyof VolumeMount, value: string | boolean) => {
        const newVolumes = [...volumes];
        newVolumes[index] = { ...newVolumes[index], [field]: value };
        setVolumes(newVolumes);
    };

    const onSubmit = async (data: ContainerFormValues) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                ports: ports.filter((p) => p.hostPort && p.containerPort),
                env: envVars
                    .filter((e) => e.key && e.value)
                    .reduce(
                        (acc, e) => {
                            acc[e.key] = e.value;
                            return acc;
                        },
                        {} as Record<string, string>,
                    ),
                volumes: volumes.filter((v) => v.hostPath && v.containerPath),
            };

            await drinoDocker.post('/containers', payload).consume();
            router.push('/docker/containers');
            router.refresh();
        } catch (error) {
            console.error('Erreur lors de la création du conteneur:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-6 overflow-hidden pt-5">
            <div className={'flex justify-between gap-4 px-6'}>
                <div className="flex gap-3">
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Container className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-semibold leading-none tracking-tight">
                            Nouveau conteneur
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Créer et configurer un nouveau conteneur Docker
                        </p>
                    </div>
                </div>

                <div className="mt-1 flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                    >
                        <ArrowLeft /> Retour
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Création en cours...
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                Créer le conteneur
                            </>
                        )}
                    </Button>
                </div>
            </div>
            <ScrollAreaWithShadow className="h-full overflow-hidden">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configuration de base</CardTitle>
                                <CardDescription>
                                    Informations principales du conteneur
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nom du conteneur</FormLabel>
                                            <FormControl>
                                                <Input placeholder="mon-conteneur" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Un nom unique pour identifier le conteneur
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="image"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Image Docker</FormLabel>
                                            <FormControl>
                                                <Input placeholder="nginx:latest" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                L'image Docker à utiliser (ex: nginx:latest,
                                                postgres:15)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="hostname"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Hostname (optionnel)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="mon-app" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="network"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Réseau (optionnel)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="bridge" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="restart"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Politique de redémarrage</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionner une politique" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="no">Jamais</SelectItem>
                                                    <SelectItem value="always">Toujours</SelectItem>
                                                    <SelectItem value="on-failure">
                                                        En cas d'échec
                                                    </SelectItem>
                                                    <SelectItem value="unless-stopped">
                                                        Sauf arrêt manuel
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="autoRemove"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-base">
                                                            Suppression automatique
                                                        </span>
                                                        <FormDescription>
                                                            Supprimer le conteneur automatiquement
                                                            après arrêt
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </Label>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="privileged"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-base">
                                                            Mode privilégié
                                                        </span>
                                                        <FormDescription>
                                                            Donner des privilèges étendus au
                                                            conteneur
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </Label>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Ports</CardTitle>
                                        <CardDescription>
                                            Mappage des ports entre l'hôte et le conteneur
                                        </CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={addPort}
                                        size="sm"
                                        variant="outline"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Ajouter un port
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {ports.length === 0 ? (
                                    <p className="text-muted-foreground py-8 text-center text-sm">
                                        Aucun port configuré
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {ports.map((port, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <Input
                                                    placeholder="Port hôte"
                                                    value={port.hostPort}
                                                    onChange={(e) =>
                                                        updatePort(
                                                            index,
                                                            'hostPort',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <span className="text-muted-foreground">→</span>
                                                <Input
                                                    placeholder="Port conteneur"
                                                    value={port.containerPort}
                                                    onChange={(e) =>
                                                        updatePort(
                                                            index,
                                                            'containerPort',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <Select
                                                    value={port.protocol}
                                                    onValueChange={(value) =>
                                                        updatePort(index, 'protocol', value)
                                                    }
                                                >
                                                    <SelectTrigger className="w-24">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="tcp">TCP</SelectItem>
                                                        <SelectItem value="udp">UDP</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removePort(index)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Variables d'environnement</CardTitle>
                                        <CardDescription>
                                            Variables à injecter dans le conteneur
                                        </CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={addEnvVar}
                                        size="sm"
                                        variant="outline"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Ajouter une variable
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {envVars.length === 0 ? (
                                    <p className="text-muted-foreground py-8 text-center text-sm">
                                        Aucune variable d'environnement configurée
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {envVars.map((env, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <Input
                                                    placeholder="CLÉ"
                                                    value={env.key}
                                                    onChange={(e) =>
                                                        updateEnvVar(index, 'key', e.target.value)
                                                    }
                                                />
                                                <span className="text-muted-foreground">=</span>
                                                <Input
                                                    placeholder="valeur"
                                                    value={env.value}
                                                    onChange={(e) =>
                                                        updateEnvVar(index, 'value', e.target.value)
                                                    }
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeEnvVar(index)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Volumes</CardTitle>
                                        <CardDescription>
                                            Montage de volumes entre l'hôte et le conteneur
                                        </CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={addVolume}
                                        size="sm"
                                        variant="outline"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Ajouter un volume
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {volumes.length === 0 ? (
                                    <p className="text-muted-foreground py-8 text-center text-sm">
                                        Aucun volume configuré
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {volumes.map((volume, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <Input
                                                    placeholder="/chemin/hôte"
                                                    value={volume.hostPath}
                                                    onChange={(e) =>
                                                        updateVolume(
                                                            index,
                                                            'hostPath',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <span className="text-muted-foreground">→</span>
                                                <Input
                                                    placeholder="/chemin/conteneur"
                                                    value={volume.containerPath}
                                                    onChange={(e) =>
                                                        updateVolume(
                                                            index,
                                                            'containerPath',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={volume.readOnly}
                                                        onCheckedChange={(checked) =>
                                                            updateVolume(index, 'readOnly', checked)
                                                        }
                                                    />
                                                    <Label className="text-xs">RO</Label>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeVolume(index)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </form>
                </Form>
            </ScrollAreaWithShadow>
        </div>
    );
}
