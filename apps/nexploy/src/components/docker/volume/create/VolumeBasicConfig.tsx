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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select.tsx';
import { VOLUME_DRIVERS } from '@/lib/constants/docker.ts';

export function VolumeBasicConfig() {
    const t = useTranslations('docker.createVolumePage');
    const tDrivers = useTranslations('docker.volumeDrivers');

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
                <FormField
                    control={form.control}
                    name="driver"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('driver')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectDriver')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>{t('driver')}</SelectLabel>
                                        {VOLUME_DRIVERS.map((driver) => (
                                            <SelectItem key={driver} value={driver}>
                                                {tDrivers(driver)}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FormDescription>{t('driverDescription')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
