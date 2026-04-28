'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import {
    FormControl,
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

export function CreateVolumeConfig() {
    const t = useTranslations('repository.pipeline.config');
    const tDocker = useTranslations('docker');
    const form = useFormContext();

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('volumeName')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder={t('volumeNamePlaceholder')} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="driver"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('volumeDriver')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('selectDriver')} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{t('volumeDriver')}</SelectLabel>
                                    {VOLUME_DRIVERS.map((driver) => (
                                        <SelectItem key={driver} value={driver}>
                                            {tDocker(`volumeDrivers.${driver}`)}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
