'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
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
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';

export const VOLUME_DRIVERS = ['local', 'nfs', 'cifs'] as const;
export type VolumeDriver = (typeof VOLUME_DRIVERS)[number];

interface VolumeDriverSelectProps {
    name?: string;
    messageClassName?: string;
}

export function VolumeDriverSelect({ name = 'driver', messageClassName }: VolumeDriverSelectProps) {
    const t = useTranslations('docker.volumeDriver');
    const tDrivers = useTranslations('docker.volumeDrivers');
    const form = useFormContext();

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('driver')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger className="min-w-30">
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
                    <FormMessage className={messageClassName} />
                    <FormDescription>{t('driverDescription')}</FormDescription>
                </FormItem>
            )}
        />
    );
}
