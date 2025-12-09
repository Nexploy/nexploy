'use client';

import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Network, Plus, Trash2 } from 'lucide-react';
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
import { onNetworkCreateAction } from '@/actions/docker/network/networkCreate.action';
import { toast } from 'sonner';
import { networkCreateSchema } from '@workspace/schemas-zod/docker/network/networkAction.schema';
import { useIpamConfig } from '@/hooks/useIpamConfig';
import { useKeyValueState } from '@/hooks/useKeyValueState';
import { CheckboxField } from '@/components/forms/CheckboxField';
import { Separator } from '@workspace/ui/components/separator';
import { AdvancedConfig } from '@/components/docker/network/create/AdvancedConfig';

const NETWORK_DRIVERS = [
    { value: 'bridge', label: 'Bridge', description: 'Réseau isolé sur un seul hôte Docker' },
    { value: 'host', label: 'Host', description: "Utilise directement le réseau de l'hôte" },
    { value: 'overlay', label: 'Overlay', description: 'Réseau multi-hôtes pour Docker Swarm' },
    { value: 'macvlan', label: 'Macvlan', description: 'Attribue une adresse MAC aux conteneurs' },
    { value: 'none', label: 'None', description: 'Aucune connectivité réseau' },
] as const;

const NETWORK_SCOPES = [
    { value: 'local', label: 'Local' },
    { value: 'global', label: 'Global' },
    { value: 'swarm', label: 'Swarm' },
] as const;

export default function CreateNetworkPage() {
    const router = useRouter();
    const auxAddressState = useKeyValueState();
    const ipamConfig = useIpamConfig();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onNetworkCreateAction,
        zodResolver(networkCreateSchema),
        {
            formProps: {
                defaultValues: {
                    name: '',
                    driver: 'bridge',
                    checkDuplicate: true,
                    internal: false,
                    attachable: false,
                    enableIPv4: true,
                    enableIPv6: false,
                    ipam: undefined,
                    options: {},
                    labels: {},
                },
            },
            actionProps: {
                onExecute: ({ input }) => {
                    toast.loading(`Création du réseau ${input.name} en cours...`);
                },
                onSuccess: () => {
                    toast.dismiss();
                    router.push('/docker/networks');
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    const handleAddIpamConfig = () => {
        if (auxAddressState.key.trim() && auxAddressState.value.trim()) {
            ipamConfig.addAuxAddress(auxAddressState.key, auxAddressState.value);
            auxAddressState.reset();
        }

        const newConfigs = ipamConfig.addConfig();
        if (newConfigs) {
            form.setValue('ipam.config', newConfigs);
        }
    };

    const handleRemoveIpamConfig = (index: number) => {
        const newConfigs = ipamConfig.removeConfig(index);
        form.setValue('ipam.config', newConfigs);
    };

    return (
        <div className="flex flex-1 flex-col overflow-hidden pt-5">
            <Form {...form}>
                <form
                    className="flex flex-1 flex-col overflow-hidden"
                    onSubmit={handleSubmitWithAction}
                >
                    <div className="mb-5 flex justify-between gap-4 px-5">
                        <div className="flex gap-3">
                            <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                                <Network className="text-primary size-7" />
                            </div>
                            <div>
                                <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                    Nouveau réseau
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    Créer un nouveau réseau Docker
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
                                {isSubmitting ? 'Création...' : 'Créer le réseau'}
                            </Button>
                        </div>
                    </div>

                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className="space-y-4 overflow-hidden px-5 pb-5">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Configuration de base</CardTitle>
                                    <CardDescription>
                                        Configurez les paramètres du nouveau réseau
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nom du réseau</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="mon-reseau" />
                                                </FormControl>
                                                <FormMessage />
                                                <FormDescription>
                                                    Un nom unique pour identifier le réseau (ex:
                                                    app-network, backend-net)
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />

                                    <CheckboxField
                                        control={form.control}
                                        name="checkDuplicate"
                                        label="Vérifier les doublons"
                                        description="Vérifie si un réseau avec le même nom existe déjà"
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
                                                        <SelectTrigger className="min-w-30">
                                                            <SelectValue placeholder="Sélectionner un driver" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {NETWORK_DRIVERS.map((driver) => (
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
                                                    Le type de réseau à créer
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="scope"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Scope</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="min-w-30">
                                                            <SelectValue placeholder="Sélectionner un scope" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {NETWORK_SCOPES.map((scope) => (
                                                            <SelectItem
                                                                key={scope.value}
                                                                value={scope.value}
                                                            >
                                                                {scope.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                                <FormDescription>
                                                    La portée du réseau (local, global ou swarm)
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-4 pt-2">
                                        <CheckboxField
                                            control={form.control}
                                            name="enableIPv4"
                                            label="Activer IPv4"
                                            description="Active le support du protocole IPv4"
                                        />
                                        <CheckboxField
                                            control={form.control}
                                            name="enableIPv6"
                                            label="Activer IPv6"
                                            description="Active le support du protocole IPv6"
                                        />
                                        <CheckboxField
                                            control={form.control}
                                            name="internal"
                                            label="Réseau interne"
                                            description="Restreint l'accès externe (pas d'accès Internet)"
                                        />
                                        <CheckboxField
                                            control={form.control}
                                            name="attachable"
                                            label="Attachable"
                                            description="Permet aux conteneurs standalone de s'y connecter"
                                        />
                                        <CheckboxField
                                            control={form.control}
                                            name="ingress"
                                            label="Ingress"
                                            description="Réseau d'entrée pour les services Swarm"
                                        />
                                        <CheckboxField
                                            control={form.control}
                                            name="configOnly"
                                            label="Configuration seulement"
                                            description="Crée un réseau de configuration uniquement"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Configuration réseau (IPAM)</CardTitle>
                                    <CardDescription>
                                        Configurez les paramètres IPAM pour ce réseau
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="ipam.driver"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Driver IPAM</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        placeholder="default"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                                <FormDescription>
                                                    Le driver IPAM à utiliser (par défaut : default)
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-4">
                                        <FormLabel>Configurations IP</FormLabel>
                                        <FormDescription>
                                            Ajoutez des configurations IP pour ce réseau
                                        </FormDescription>

                                        <div className="space-y-8">
                                            <div className="flex flex-1 gap-2">
                                                <Input
                                                    placeholder="Sous-réseau (ex: 192.168.1.0/24)"
                                                    value={ipamConfig.subnet}
                                                    onChange={(e) =>
                                                        ipamConfig.setSubnet(e.target.value)
                                                    }
                                                />
                                                <Input
                                                    placeholder="Plage IP (ex: 192.168.1.10-192.168.1.20)"
                                                    value={ipamConfig.ipRange}
                                                    onChange={(e) =>
                                                        ipamConfig.setIpRange(e.target.value)
                                                    }
                                                />
                                                <Input
                                                    placeholder="Passerelle (ex: 192.168.1.1)"
                                                    value={ipamConfig.gateway}
                                                    onChange={(e) =>
                                                        ipamConfig.setGateway(e.target.value)
                                                    }
                                                />

                                                <Button
                                                    type="button"
                                                    size={'icon'}
                                                    disabled={
                                                        !(
                                                            ipamConfig.gateway &&
                                                            ipamConfig.ipRange &&
                                                            ipamConfig.subnet
                                                        )
                                                    }
                                                    variant="outline"
                                                    icon={Plus}
                                                    onClick={handleAddIpamConfig}
                                                ></Button>
                                            </div>
                                        </div>

                                        {ipamConfig.configs.map((config, index) => (
                                            <div
                                                key={index}
                                                className="bg-card rounded-lg border p-4 shadow-sm"
                                            >
                                                <div className="flex justify-between">
                                                    <span className="text-base leading-none font-semibold">
                                                        Configuration {index + 1}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        icon={Trash2}
                                                        onClick={() =>
                                                            handleRemoveIpamConfig(index)
                                                        }
                                                    />
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    {config.subnet && (
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-muted-foreground min-w-[120px] text-sm font-medium">
                                                                Sous-réseau:
                                                            </span>
                                                            <code className="bg-muted rounded px-2 py-0.5 font-mono text-sm">
                                                                {config.subnet}
                                                            </code>
                                                        </div>
                                                    )}
                                                    <Separator />
                                                    {config.ipRange && (
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-muted-foreground min-w-[120px] text-sm font-medium">
                                                                Plage IP:
                                                            </span>
                                                            <code className="bg-muted rounded px-2 py-0.5 font-mono text-sm">
                                                                {config.ipRange}
                                                            </code>
                                                        </div>
                                                    )}
                                                    <Separator />
                                                    {config.gateway && (
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-muted-foreground min-w-[120px] text-sm font-medium">
                                                                Passerelle:
                                                            </span>
                                                            <code className="bg-muted rounded px-2 py-0.5 font-mono text-sm">
                                                                {config.gateway}
                                                            </code>
                                                        </div>
                                                    )}
                                                    {config.auxAddress &&
                                                        Object.keys(config.auxAddress).length >
                                                            0 && (
                                                            <div className="border-t pt-2">
                                                                <p className="mb-2 text-sm font-medium">
                                                                    Adresses auxiliaires:
                                                                </p>
                                                                <div className="space-y-1.5 pl-4">
                                                                    {Object.entries(
                                                                        config.auxAddress,
                                                                    ).map(([k, v]) => (
                                                                        <div
                                                                            key={k}
                                                                            className="flex items-center gap-2"
                                                                        >
                                                                            <span className="text-muted-foreground text-sm">
                                                                                {k}:
                                                                            </span>
                                                                            <code className="bg-muted rounded px-2 py-0.5 font-mono text-sm">
                                                                                {v}
                                                                            </code>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Configuration depuis un réseau existant</CardTitle>
                                    <CardDescription>
                                        Créez ce réseau basé sur la configuration d'un réseau
                                        existant
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="configFrom.network"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nom du réseau source</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="réseau-existant"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                                <FormDescription>
                                                    Le nom du réseau dont copier la configuration
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <AdvancedConfig form={form} />
                        </div>
                    </ScrollAreaWithShadow>
                </form>
            </Form>
        </div>
    );
}
