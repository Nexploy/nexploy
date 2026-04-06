'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel } from '@workspace/ui/components/form';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';

export function SetEnvironmentConfig() {
    const t = useTranslations('repository.pipeline.config');
    const { control } = useFormContext();
    const environments = useEnvironmentStore((s) => s.environments);

    return (
        <div className="space-y-4">
            <FormField
                control={control}
                name="environmentId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('environment')}</FormLabel>
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder={t('selectEnvironment')} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{t('environment')}</SelectLabel>
                                    {environments.map((env) => (
                                        <SelectItem key={env.id} value={env.id} className="text-xs">
                                            {env.name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}
            />
            <p className="text-muted-foreground text-xs">{t('setEnvironmentInfo')}</p>
        </div>
    );
}
