'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
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
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import type { RegistryInfo } from '@/services/registry.service';

interface RegistrySelectorProps {
    registries: RegistryInfo[];
}

export function RegistrySelector({ registries }: RegistrySelectorProps) {
    const t = useTranslations('docker.pullImagePage');
    const form = useFormContext();

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('registry')}</CardTitle>
                <CardDescription>{t('registryDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField
                    control={form.control}
                    name="registryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('registryLabel')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('registryNone')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="none">{t('registryNone')}</SelectItem>
                                        {registries.map((registry) => (
                                            <SelectItem key={registry.id} value={registry.id}>
                                                {registry.name} ({registry.url})
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
