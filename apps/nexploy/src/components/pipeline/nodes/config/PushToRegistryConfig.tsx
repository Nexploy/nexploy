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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';
import type { RegistryInfo } from '@/services/registry.service';
import { AlertTriangle, Loader2 } from 'lucide-react';

export function PushToRegistryConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    const { data: registries, isLoading } = useSWR<RegistryInfo[]>('/api/registries', fetcherApi);
    const registryList = registries ?? [];

    const savedRegistryName = form.watch('registryName');

    return (
        <FormField
            control={form.control}
            name="registryId"
            render={({ field }) => {
                const isStale =
                    !isLoading &&
                    !!field.value &&
                    registryList.length >= 0 &&
                    !registryList.find((r) => r.id === field.value);

                return (
                    <FormItem>
                        <FormLabel>{t('registry')}</FormLabel>
                        <FormControl>
                            <Select
                                {...field}
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    const registry = registryList.find((r) => r.id === value)!;
                                    form.setValue('registryName', registry.name);
                                }}
                                disabled={isLoading}
                            >
                                <SelectTrigger
                                    className={'min-w-40 overflow-hidden data-[placeholder]:!pl-3'}
                                >
                                    {isLoading ? (
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            {t('registriesLoading')}
                                        </span>
                                    ) : isStale ? (
                                        <span className="flex items-center gap-1.5">
                                            <AlertTriangle className="h-3 w-3 shrink-0" />
                                            {t('registryUnavailable')}
                                        </span>
                                    ) : (
                                        <SelectValue placeholder={t('registryPlaceholder')} />
                                    )}
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>{t('registry')}</SelectLabel>
                                        {registryList.length === 0 ? (
                                            <span className="text-muted-foreground px-2 py-1.5 text-sm">
                                                {t('noRegistry')}
                                            </span>
                                        ) : (
                                            registryList.map((registry) => (
                                                <SelectItem key={registry.id} value={registry.id}>
                                                    {registry.name} ({registry.url})
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                );
            }}
        />
    );
}
