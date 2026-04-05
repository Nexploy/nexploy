'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import { Plus, Trash2 } from 'lucide-react';
import { useIpamConfig } from '@/hooks/useIpamConfig';
import { useKeyValueState } from '@/hooks/useKeyValueState';

export function NetworkIpamConfig() {
    const t = useTranslations('docker.createNetworkPage');
    const form = useFormContext();
    const auxAddressState = useKeyValueState();
    const ipamConfig = useIpamConfig();

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
                                <Input {...field} value={field.value ?? ''} placeholder="default" />
                            </FormControl>
                            <FormMessage />
                            <FormDescription>{t('ipamDriverDescription')}</FormDescription>
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <FormLabel>{t('ipConfigurations')}</FormLabel>
                    <FormDescription>{t('ipConfigurationsDescription')}</FormDescription>

                    <div className="space-y-8">
                        <div className="flex flex-1 gap-2">
                            <Input
                                placeholder={t('subnetPlaceholder')}
                                value={ipamConfig.subnet}
                                onChange={(e) => ipamConfig.setSubnet(e.target.value)}
                            />
                            <Input
                                placeholder={t('ipRangePlaceholder')}
                                value={ipamConfig.ipRange}
                                onChange={(e) => ipamConfig.setIpRange(e.target.value)}
                            />
                            <Input
                                placeholder={t('gatewayPlaceholder')}
                                value={ipamConfig.gateway}
                                onChange={(e) => ipamConfig.setGateway(e.target.value)}
                            />
                            <Button
                                type="button"
                                size="icon"
                                disabled={
                                    !(ipamConfig.gateway && ipamConfig.ipRange && ipamConfig.subnet)
                                }
                                variant="outline"
                                icon={Plus}
                                onClick={handleAddIpamConfig}
                            />
                        </div>
                    </div>

                    {ipamConfig.configs.map((config, index) => (
                        <div key={index} className="bg-card rounded-lg border p-4 shadow-sm">
                            <div className="flex justify-between">
                                <span className="text-base leading-none font-semibold">
                                    {t('configuration')} {index + 1}
                                </span>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    icon={Trash2}
                                    onClick={() => handleRemoveIpamConfig(index)}
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
                                {config.auxAddress && Object.keys(config.auxAddress).length > 0 && (
                                    <div className="border-t pt-2">
                                        <p className="mb-2 text-sm font-medium">
                                            {t('auxAddresses')}
                                        </p>
                                        <div className="space-y-1.5 pl-4">
                                            {Object.entries(config.auxAddress).map(([k, v]) => (
                                                <div key={k} className="flex items-center gap-2">
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
    );
}
