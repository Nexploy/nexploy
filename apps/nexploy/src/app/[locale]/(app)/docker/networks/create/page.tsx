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
import { useTranslations } from 'next-intl';

const NETWORK_DRIVERS = ['bridge', 'host', 'overlay', 'macvlan', 'none'] as const;

const NETWORK_SCOPES = ['local', 'global', 'swarm'] as const;

export default function CreateNetworkPage() {
    const t = useTranslations('docker.createNetworkPage');
    const tScopes = useTranslations('docker.scopes');
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
                    toast.loading(t('creatingNetwork', { name: input.name }));
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
        <div className="flex h-full flex-1 flex-col gap-4 pt-5">
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
                                    {t('title')}
                                </h1>
                                <p className="text-muted-foreground text-sm">{t('description')}</p>
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
                                <Plus />
                                {isSubmitting ? t('creating') : t('createButton')}
                            </Button>
                        </div>
                    </div>

                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className="space-y-4 overflow-hidden px-5 pb-5">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('basicConfig')}</CardTitle>
                                    <CardDescription>{t('configureParams')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('networkName')}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder={t('networkNamePlaceholder')}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                                <FormDescription>
                                                    {t('networkNameDescription')}
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />

                                    <CheckboxField
                                        control={form.control}
                                        name="checkDuplicate"
                                        label={t('checkDuplicate')}
                                        description={t('checkDuplicateDescription')}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="driver"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('driver')}</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="min-w-30">
                                                            <SelectValue
                                                                placeholder={t('selectDriver')}
                                                            />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {NETWORK_DRIVERS.map((driver) => (
                                                            <SelectItem key={driver} value={driver}>
                                                                {driver.charAt(0).toUpperCase() +
                                                                    driver.slice(1)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                                <FormDescription>
                                                    {t('driverDescription')}
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="scope"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('scope')}</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="min-w-30">
                                                            <SelectValue
                                                                placeholder={t('selectScope')}
                                                            />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {NETWORK_SCOPES.map((scope) => (
                                                            <SelectItem key={scope} value={scope}>
                                                                {tScopes(scope)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                                <FormDescription>
                                                    {t('scopeDescription')}
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-4 pt-2">
                                        <CheckboxField
                                            control={form.control}
                                            name="enableIPv4"
                                            label={t('enableIPv4')}
                                            description={t('enableIPv4Description')}
                                        />
                                        <CheckboxField
                                            control={form.control}
                                            name="enableIPv6"
                                            label={t('enableIPv6')}
                                            description={t('enableIPv6Description')}
                                        />
                                        <CheckboxField
                                            control={form.control}
                                            name="internal"
                                            label={t('internalNetwork')}
                                            description={t('internalNetworkDescription')}
                                        />
                                        <CheckboxField
                                            control={form.control}
                                            name="attachable"
                                            label={t('attachable')}
                                            description={t('attachableDescription')}
                                        />
                                        <CheckboxField
                                            control={form.control}
                                            name="ingress"
                                            label={t('ingress')}
                                            description={t('ingressDescription')}
                                        />
                                        <CheckboxField
                                            control={form.control}
                                            name="configOnly"
                                            label={t('configOnly')}
                                            description={t('configOnlyDescription')}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('ipamConfig')}</CardTitle>
                                    <CardDescription>{t('ipamConfigDescription')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="ipam.driver"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('ipamDriver')}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        placeholder="default"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                                <FormDescription>
                                                    {t('ipamDriverDescription')}
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-4">
                                        <FormLabel>{t('ipConfigurations')}</FormLabel>
                                        <FormDescription>
                                            {t('ipConfigurationsDescription')}
                                        </FormDescription>

                                        <div className="space-y-8">
                                            <div className="flex flex-1 gap-2">
                                                <Input
                                                    placeholder={t('subnetPlaceholder')}
                                                    value={ipamConfig.subnet}
                                                    onChange={(e) =>
                                                        ipamConfig.setSubnet(e.target.value)
                                                    }
                                                />
                                                <Input
                                                    placeholder={t('ipRangePlaceholder')}
                                                    value={ipamConfig.ipRange}
                                                    onChange={(e) =>
                                                        ipamConfig.setIpRange(e.target.value)
                                                    }
                                                />
                                                <Input
                                                    placeholder={t('gatewayPlaceholder')}
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
                                                        {t('configuration')} {index + 1}
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
                                                                {t('subnet')}
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
                                                                {t('ipRange')}
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
                                                                {t('gateway')}
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
                                                                    {t('auxAddresses')}
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
                                    <CardTitle>{t('configFromExisting')}</CardTitle>
                                    <CardDescription>
                                        {t('configFromExistingDescription')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="configFrom.network"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('sourceNetworkName')}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder={t('sourceNetworkPlaceholder')}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                                <FormDescription>
                                                    {t('sourceNetworkDescription')}
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
