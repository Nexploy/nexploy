'use client';

import { FormControl, FormField, FormItem } from '@workspace/ui/components/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Switch } from '@workspace/ui/components/switch';
import { useFormContext } from 'react-hook-form';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';
import { useTranslations } from 'next-intl';

export function DeploymentFields() {
    const { control } = useFormContext();
    const { environments } = useEnvironmentStore();
    const t = useTranslations('repository.deployment');

    const isLoading = environments.length === 0;

    return (
        <>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex flex-col gap-0.5">
                    <span className="text-base">{t('environment')}</span>
                    <p className="text-muted-foreground text-sm">{t('environmentDescription')}</p>
                </div>
                <FormField
                    control={control}
                    name="environmentId"
                    render={({ field }) => (
                        <FormItem>
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={isLoading}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-48">
                                        {isLoading ? (
                                            <span className="text-muted-foreground">
                                                {t('loading')}
                                            </span>
                                        ) : (
                                            <SelectValue placeholder={t('selectEnvironment')} />
                                        )}
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {environments.map((env) => (
                                        <SelectItem key={env.id} value={env.id}>
                                            {env.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={control}
                name="autoDeploy"
                render={({ field }) => (
                    <FormItem>
                        <label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-base">{t('autoDeploy')}</span>
                                <p className="text-muted-foreground text-sm">
                                    {t('autoDeployDescription')}
                                </p>
                            </div>
                            <FormControl>
                                <Switch
                                    {...field}
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </label>
                    </FormItem>
                )}
            />
        </>
    );
}
