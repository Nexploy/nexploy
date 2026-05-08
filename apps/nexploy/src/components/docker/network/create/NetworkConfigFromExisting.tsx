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
import { Input } from '@workspace/ui/components/input';

export function NetworkConfigFromExisting() {
    const t = useTranslations('docker.createNetworkPage');
    const form = useFormContext();

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
