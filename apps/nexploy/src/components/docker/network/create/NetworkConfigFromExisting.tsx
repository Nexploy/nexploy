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

export function NetworkConfigFromExisting() {
    const t = useTranslations('docker.createNetworkPage');
    const form = useFormContext();

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('configFromExisting')}</CardTitle>
                <CardDescription>{t('configFromExistingDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField
                    control={form.control}
                    name="configFrom.network"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('sourceNetworkName')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder={t('sourceNetworkPlaceholder')} />
                            </FormControl>
                            <FormMessage />
                            <FormDescription>{t('sourceNetworkDescription')}</FormDescription>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
