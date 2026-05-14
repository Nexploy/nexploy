'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent } from '@workspace/ui/components/card';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';
import { Copy } from 'lucide-react';
import {
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
import { useNetworksStore } from '@/stores/docker/useNetworksStore.ts';

export function NetworkConfigFromExisting() {
    const t = useTranslations('docker.createNetworkPage');
    const form = useFormContext();

    const networks = useNetworksStore((state) => state.networks);
    const configOnlyNetworks = networks.filter((net) => net.configOnly);

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Copy}
                title={t('configFromExisting')}
                description={t('configFromExistingDescription')}
            />
            <CardContent>
                <FormField
                    control={form.control}
                    name="configFrom.network"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('sourceNetworkName')}</FormLabel>
                            <Select {...field}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('sourceNetworkPlaceholder')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {configOnlyNetworks.length === 0 ? (
                                        <p className="text-muted-foreground text-center text-sm">
                                            {t('sourceNetworkEmpty')}
                                        </p>
                                    ) : (
                                        configOnlyNetworks.map((net) => (
                                            <SelectItem key={net.id} value={net.name}>
                                                {net.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            <FormDescription>{t('sourceNetworkDescription')}</FormDescription>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
