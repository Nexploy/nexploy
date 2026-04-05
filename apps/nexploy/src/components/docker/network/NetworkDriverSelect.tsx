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

export const NETWORK_DRIVERS = ['bridge', 'host', 'overlay', 'macvlan', 'none'] as const;

interface NetworkDriverSelectProps {
    name?: string;
    messageClassName?: string;
}

export function NetworkDriverSelect({
    name = 'driver',
    messageClassName,
}: NetworkDriverSelectProps) {
    const t = useTranslations('docker.networkDriver');
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
                            <SelectTrigger>
                                <SelectValue placeholder={t('selectDriver')} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>{t('driver')}</SelectLabel>
                                {NETWORK_DRIVERS.map((driver) => (
                                    <SelectItem key={driver} value={driver}>
                                        {driver.charAt(0).toUpperCase() + driver.slice(1)}
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
