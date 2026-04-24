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
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Input } from '@workspace/ui/components/input';
import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';
import type { RegistryInfo } from '@/services/registry.service';

const DOCKER_HUB = 'docker-hub';

export function PullFromRegistryConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    const { data: registries = [] } = useSWR<RegistryInfo[]>({ url: '/api/registries' }, fetcherApi);
    const registryId = form.watch('registryId');
    const isDockerHub = !registryId || registryId === DOCKER_HUB;

    return (
        <div className="flex flex-col gap-4">
            <FormField
                control={form.control}
                name="registryId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('registry')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? DOCKER_HUB}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('registryPlaceholder')} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value={DOCKER_HUB}>
                                        {t('dockerHubLabel')}
                                    </SelectItem>
                                </SelectGroup>
                                <SelectSeparator />
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

            <FormField
                control={form.control}
                name="imageName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('pullImageName')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder={
                                    isDockerHub
                                        ? t('pullImageNamePlaceholderHub')
                                        : t('pullImageNamePlaceholderPrivate')
                                }
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
