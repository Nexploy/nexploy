'use client';

import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray } from 'react-hook-form';
import { ArrowLeft, Container, Plus, Trash2 } from 'lucide-react';
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
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { toast } from 'sonner';
import { ContainerCreateFormSchema } from '@workspace/schemas-zod/container/containerCreate.schema';
import { onContainerCreateAction } from '@/actions/docker/container/containerCreate.action';

export default function AddContainerPage() {
    const router = useRouter();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onContainerCreateAction,
        zodResolver(ContainerCreateFormSchema),
        {
            formProps: {
                defaultValues: {
                    name: '',
                    image: '',
                    // restart: 'unless-stopped',
                    // network: '',
                    // hostname: '',
                    // autoRemove: false,
                    // privileged: false,
                    // ports: [],
                    // envVars: [],
                    // volumes: [],
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success('Conteneur créé avec succès');
                    router.push('/docker/containers');
                    router.refresh();
                },
            },
        },
    );

    const {
        fields: portsFields,
        append: appendPort,
        remove: removePort,
    } = useFieldArray({
        control: form.control,
        imageId: 'ports',
    });

    const {
        fields: envVarsFields,
        append: appendEnvVar,
        remove: removeEnvVar,
    } = useFieldArray({
        control: form.control,
        imageId: 'envVars',
    });

    const {
        fields: volumesFields,
        append: appendVolume,
        remove: removeVolume,
    } = useFieldArray({
        control: form.control,
        imageId: 'volumes',
    });

    const isSubmitting = action.status === 'executing';

    return (
        <div className="flex flex-1 flex-col gap-5 overflow-hidden pt-5">
            <div className="flex justify-between gap-4 px-6">
                <div className="flex gap-3">
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Container className="text-primary size-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            Nouveau conteneur
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Créer et configurer un nouveau conteneur Docker
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
                    <Button type="submit" disabled={isSubmitting} onClick={handleSubmitWithAction}>
                        <Plus />
                        {isSubmitting ? 'Création...' : 'Créer le conteneur'}
                    </Button>
                </div>
            </div>

            <ScrollAreaWithShadow className="h-full overflow-hidden">
                <Form {...form}>
                    <div className="space-y-6 px-6 pb-6">
                        {/* Configuration de base */}
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
                                                        <FormDescription className="m-0">
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
                                                        <FormDescription className="m-0">
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

                        {/* Ports */}
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
                                        onClick={() =>
                                            appendPort({
                                                hostPort: '',
                                                containerPort: '',
                                                protocol: 'tcp',
                                            })
                                        }
                                        size="sm"
                                        variant="outline"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Ajouter un port
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {portsFields.length === 0 ? (
                                    <p className="text-muted-foreground py-8 text-center text-sm">
                                        Aucun port configuré
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {portsFields.map((field, index) => (
                                            <div key={field.id} className="flex items-center gap-3">
                                                <FormField
                                                    control={form.control}
                                                    name={`ports.${index}.hostPort`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Port hôte"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <span className="text-muted-foreground">→</span>
                                                <FormField
                                                    control={form.control}
                                                    name={`ports.${index}.containerPort`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Port conteneur"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`ports.${index}.protocol`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Select
                                                                    value={field.value}
                                                                    onValueChange={field.onChange}
                                                                >
                                                                    <SelectTrigger className="w-24">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="tcp">
                                                                            TCP
                                                                        </SelectItem>
                                                                        <SelectItem value="udp">
                                                                            UDP
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
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

                        {/* Variables d'environnement */}
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
                                        onClick={() => appendEnvVar({ key: '', value: '' })}
                                        size="sm"
                                        variant="outline"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Ajouter une variable
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {envVarsFields.length === 0 ? (
                                    <p className="text-muted-foreground py-8 text-center text-sm">
                                        Aucune variable d'environnement configurée
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {envVarsFields.map((field, index) => (
                                            <div key={field.id} className="flex items-center gap-3">
                                                <FormField
                                                    control={form.control}
                                                    name={`envVars.${index}.key`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="CLÉ"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <span className="text-muted-foreground">=</span>
                                                <FormField
                                                    control={form.control}
                                                    name={`envVars.${index}.value`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="valeur"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
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

                        {/* Volumes */}
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
                                        onClick={() =>
                                            appendVolume({
                                                hostPath: '',
                                                containerPath: '',
                                                readOnly: false,
                                            })
                                        }
                                        size="sm"
                                        variant="outline"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Ajouter un volume
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {volumesFields.length === 0 ? (
                                    <p className="text-muted-foreground py-8 text-center text-sm">
                                        Aucun volume configuré
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {volumesFields.map((field, index) => (
                                            <div key={field.id} className="flex items-center gap-3">
                                                <FormField
                                                    control={form.control}
                                                    name={`volumes.${index}.hostPath`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="/chemin/hôte"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <span className="text-muted-foreground">→</span>
                                                <FormField
                                                    control={form.control}
                                                    name={`volumes.${index}.containerPath`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="/chemin/conteneur"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`volumes.${index}.readOnly`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <div className="flex items-center gap-2">
                                                                    <Switch
                                                                        checked={field.value}
                                                                        onCheckedChange={
                                                                            field.onChange
                                                                        }
                                                                    />
                                                                    <Label className="text-xs">
                                                                        RO
                                                                    </Label>
                                                                </div>
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
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
                    </div>
                </Form>
            </ScrollAreaWithShadow>
        </div>
    );
}
