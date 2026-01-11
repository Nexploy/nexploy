'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
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
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Switch } from '@workspace/ui/components/switch';
import { useFormContext } from 'react-hook-form';
import { Rocket } from 'lucide-react';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';
import { useTranslations } from 'next-intl';

export function DeploymentStep() {
    const { control } = useFormContext();
    const { environments } = useEnvironmentStore();
    const t = useTranslations('repository.steps.deployment');

    return (
        <Card>
            <CardHeader>
                <div className={'flex gap-2'}>
                    <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <Rocket className="text-primary size-5" />
                    </div>
                    <div className={'flex flex-col'}>
                        <CardTitle>{t('title')}</CardTitle>
                        <CardDescription>{t('description')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={control}
                    name="environmentId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('environment')}</FormLabel>
                            <Select {...field} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectEnvironment')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {environments.map((env) => (
                                        <SelectItem key={env.id} value={env.id}>
                                            {env.name} ({env.host ?? env.socketPath})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>{t('environmentDescription')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="autoDeploy"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-base">{t('autoDeploy')}</span>
                                    <FormDescription className="m-0">
                                        {t('autoDeployDescription')}
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormLabel>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
