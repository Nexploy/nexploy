'use client';

import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, HardDrive, Info, Plus, X } from 'lucide-react';
import { useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { onVolumeCreateAction } from '@/actions/docker/volume/volumeCreate.action';
import { Alert, AlertTitle } from '@workspace/ui/components/alert';
import { toast } from 'sonner';
import { volumeCreateSchema } from '@workspace/schemas-zod/volume/volumeAction.schema';

const VOLUME_DRIVERS = [
    {
        value: 'local',
        label: 'Local',
    },
    {
        value: 'nfs',
        label: 'NFS',
    },
    {
        value: 'cifs',
        label: 'CIFS',
    },
];

export default function CreateVolumePage() {
    const router = useRouter();
    const [driverOptKey, setDriverOptKey] = useState('');
    const [driverOptValue, setDriverOptValue] = useState('');
    const [labelKey, setLabelKey] = useState('');
    const [labelValue, setLabelValue] = useState('');

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onVolumeCreateAction,
        zodResolver(volumeCreateSchema),
        {
            formProps: {
                defaultValues: {
                    name: '',
                    driver: 'local',
                    driverOpts: {},
                    labels: {},
                },
            },
            actionProps: {
                onExecute: ({ input }) => {
                    toast.loading(`Création du volume ${input.name} en cours...`);
                },
                onSuccess: () => {
                    toast.dismiss();
                    router.push('/docker/volumes');
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    const addDriverOpt = () => {
        if (driverOptKey.trim() && driverOptValue.trim()) {
            const currentOpts = form.getValues('driverOpts') || {};
            form.setValue('driverOpts', {
                ...currentOpts,
                [driverOptKey.trim()]: driverOptValue.trim(),
            });
            setDriverOptKey('');
            setDriverOptValue('');
        }
    };

    const removeDriverOpt = (key: string) => {
        const currentOpts = form.getValues('driverOpts') || {};
        const { [key]: _, ...rest } = currentOpts;
        form.setValue('driverOpts', rest);
    };

    const addLabel = () => {
        if (labelKey.trim() && labelValue.trim()) {
            const currentLabels = form.getValues('labels') || {};
            form.setValue('labels', {
                ...currentLabels,
                [labelKey.trim()]: labelValue.trim(),
            });
            setLabelKey('');
            setLabelValue('');
        }
    };

    const removeLabel = (key: string) => {
        const currentLabels = form.getValues('labels') || {};
        const { [key]: _, ...rest } = currentLabels;
        form.setValue('labels', rest);
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
                                <HardDrive className="text-primary size-7" />
                            </div>
                            <div>
                                <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                    Nouveau volume
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    Créer un nouveau volume Docker
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
                                <Plus />
                                {isSubmitting ? 'Création...' : 'Créer le volume'}
                            </Button>
                        </div>
                    </div>

                    <Alert variant={'info'} className={'mx-5 mt-5 mb-4 w-auto'}>
                        <Info />
                        <AlertTitle>
                            Les volumes persistent les données même après la suppression des
                            conteneurs
                        </AlertTitle>
                    </Alert>

                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className="space-y-4 overflow-hidden px-5 pb-5">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Configuration</CardTitle>
                                    <CardDescription>
                                        Configurez les paramètres du nouveau volume
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nom du volume</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="mon-volume" />
                                                </FormControl>
                                                <FormMessage />
                                                <FormDescription>
                                                    Un nom unique pour identifier le volume (ex:
                                                    postgres-data, app-logs)
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="driver"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Driver</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className={'min-w-30'}>
                                                            <SelectValue placeholder="Sélectionner un driver" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {VOLUME_DRIVERS.map((driver) => (
                                                            <SelectItem
                                                                key={driver.value}
                                                                value={driver.value}
                                                            >
                                                                {driver.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                                <FormDescription>
                                                    Le driver de stockage pour ce volume
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="driverOpts"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Options du driver</FormLabel>
                                                <FormControl>
                                                    <div className="space-y-3">
                                                        <div className="flex gap-2">
                                                            <Input
                                                                placeholder="Clé (ex: type)"
                                                                value={driverOptKey}
                                                                onChange={(e) =>
                                                                    setDriverOptKey(e.target.value)
                                                                }
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        addDriverOpt();
                                                                    }
                                                                }}
                                                                className="flex-1"
                                                            />
                                                            <Input
                                                                placeholder="Valeur (ex: nfs)"
                                                                value={driverOptValue}
                                                                onChange={(e) =>
                                                                    setDriverOptValue(
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        addDriverOpt();
                                                                    }
                                                                }}
                                                                className="flex-1"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={addDriverOpt}
                                                                disabled={
                                                                    !driverOptKey.trim() ||
                                                                    !driverOptValue.trim()
                                                                }
                                                            >
                                                                <Plus className="size-4" />
                                                            </Button>
                                                        </div>
                                                        {field.value &&
                                                            Object.keys(field.value).length > 0 && (
                                                                <code className="space-y-2">
                                                                    <p className="text-sm font-medium">
                                                                        Options ajoutées :
                                                                    </p>
                                                                    <div className="space-y-2">
                                                                        {Object.entries(
                                                                            field.value,
                                                                        ).map(
                                                                            (
                                                                                [key, value],
                                                                                index,
                                                                            ) => (
                                                                                <div
                                                                                    key={index}
                                                                                    className="bg-muted flex items-center justify-between rounded-md p-1 px-2 transition-colors"
                                                                                >
                                                                                    <code className="flex items-center gap-1">
                                                                                        <code className="bg-background rounded px-2 py-1 font-mono text-sm">
                                                                                            {key}
                                                                                        </code>
                                                                                        <span className="text-muted-foreground">
                                                                                            =
                                                                                        </span>
                                                                                        <code className="bg-background rounded px-2 py-1 font-mono text-sm">
                                                                                            {value}
                                                                                        </code>
                                                                                    </code>
                                                                                    <Button
                                                                                        type="button"
                                                                                        size="icon"
                                                                                        variant="destructiveGhost"
                                                                                        onClick={() =>
                                                                                            removeDriverOpt(
                                                                                                key,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <X />
                                                                                    </Button>
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                </code>
                                                            )}
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                                <FormDescription>
                                                    Options spécifiques au driver. Exemples :{' '}
                                                    <code className="bg-muted rounded px-1 py-0.5 text-xs">
                                                        type=nfs
                                                    </code>
                                                    ,{' '}
                                                    <code className="bg-muted rounded px-1 py-0.5 text-xs">
                                                        o=addr=192.168.1.1
                                                    </code>
                                                    ,{' '}
                                                    <code className="bg-muted rounded px-1 py-0.5 text-xs">
                                                        device=/path/to/dir
                                                    </code>
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="labels"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Labels</FormLabel>
                                                <FormControl>
                                                    <div className="space-y-3">
                                                        <div className="flex gap-2">
                                                            <Input
                                                                placeholder="Clé"
                                                                value={labelKey}
                                                                onChange={(e) =>
                                                                    setLabelKey(e.target.value)
                                                                }
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        addLabel();
                                                                    }
                                                                }}
                                                                className="flex-1"
                                                            />
                                                            <Input
                                                                placeholder="Valeur"
                                                                value={labelValue}
                                                                onChange={(e) =>
                                                                    setLabelValue(e.target.value)
                                                                }
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        addLabel();
                                                                    }
                                                                }}
                                                                className="flex-1"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={addLabel}
                                                                disabled={
                                                                    !labelKey.trim() ||
                                                                    !labelValue.trim()
                                                                }
                                                            >
                                                                <Plus className="size-4" />
                                                            </Button>
                                                        </div>
                                                        {field.value &&
                                                            Object.keys(field.value).length > 0 && (
                                                                <div className="space-y-2">
                                                                    <p className="text-sm font-medium">
                                                                        Labels ajoutés :
                                                                    </p>
                                                                    <div className="space-y-2">
                                                                        {Object.entries(
                                                                            field.value,
                                                                        ).map(
                                                                            (
                                                                                [key, value],
                                                                                index,
                                                                            ) => (
                                                                                <div
                                                                                    key={index}
                                                                                    className="bg-muted flex items-center justify-between rounded-md p-1 px-2 transition-colors"
                                                                                >
                                                                                    <code className="flex items-center gap-1">
                                                                                        <code className="bg-background rounded px-2 py-1 font-mono text-sm">
                                                                                            {key}
                                                                                        </code>
                                                                                        <span className="text-muted-foreground">
                                                                                            =
                                                                                        </span>
                                                                                        <code className="bg-background rounded px-2 py-1 font-mono text-sm">
                                                                                            {value}
                                                                                        </code>
                                                                                    </code>
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="destructiveGhost"
                                                                                        size="icon"
                                                                                        onClick={() =>
                                                                                            removeLabel(
                                                                                                key,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <X />
                                                                                    </Button>
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                                <FormDescription>
                                                    Métadonnées pour organiser et identifier le
                                                    volume. Exemples :{' '}
                                                    <code className="bg-muted rounded px-1 py-0.5 text-xs">
                                                        env=production
                                                    </code>
                                                    ,{' '}
                                                    <code className="bg-muted rounded px-1 py-0.5 text-xs">
                                                        app=backend
                                                    </code>
                                                    ,{' '}
                                                    <code className="bg-muted rounded px-1 py-0.5 text-xs">
                                                        team=devops
                                                    </code>
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </ScrollAreaWithShadow>
                </form>
            </Form>
        </div>
    );
}
