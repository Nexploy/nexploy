'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent } from '@workspace/ui/components/card';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';
import { Settings } from 'lucide-react';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { VolumeDriverSelect } from '@/components/docker/volume/VolumeDriverSelect';

export function VolumeBasicConfig() {
    const t = useTranslations('docker.createVolumePage');
    const form = useFormContext();

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Settings}
                title={t('configuration')}
                description={t('configureParams')}
            />
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('volumeName')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder={t('volumeNamePlaceholder')} />
                            </FormControl>
                            <FormMessage />
                            <FormDescription>{t('volumeNameDescription')}</FormDescription>
                        </FormItem>
                    )}
                />
                <VolumeDriverSelect />
            </CardContent>
        </Card>
    );
}
