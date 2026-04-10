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

export function PushToRegistryConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    const { data: registries = [] } = useSWR<RegistryInfo[]>('/api/registries', fetcherApi);

    return (
        <FormField
            control={form.control}
            name="registryId"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('registry')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={t('registryPlaceholder')} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>{t('registry')}</SelectLabel>
                                {registries.length === 0 ? (
                                    <span className="text-muted-foreground px-2 py-1.5 text-sm">
                                        {t('noRegistry')}
                                    </span>
                                ) : (
                                    registries.map((registry) => (
                                        <SelectItem key={registry.id} value={registry.id}>
                                            {registry.name} ({registry.url})
                                        </SelectItem>
                                    ))
                                )}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                </FormItem>
            )}
        />
    );
}
