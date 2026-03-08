'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { AlertCircle, Box, Layers } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { DeploymentSettingsForm } from '@workspace/schemas-zod/repository/settings/deploymentSettings.schema';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group';
import { cn } from '@workspace/ui/lib/utils';
import Link from 'next/link';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useTranslations } from 'next-intl';

interface DeploymentModeCardProps {
    form: UseFormReturn<DeploymentSettingsForm>;
}

export function DeploymentModeCard({ form }: DeploymentModeCardProps) {
    const t = useTranslations('repository.deployment');
    const isSwarmActive = useSwarmStore((s) => s.isSwarmActive);

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Layers}
                title={t('mode')}
                description={t('modeDescription')}
            />
            <CardContent>
                <FormField
                    control={form.control}
                    name="deploymentMode"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={(value) => {
                                        if (value === 'SWARM' && !isSwarmActive) return;
                                        field.onChange(value);
                                    }}
                                    value={field.value}
                                    className="grid gap-4 sm:grid-cols-2"
                                >
                                    <FormItem>
                                        <FormControl>
                                            <RadioGroupItem
                                                value="CONTAINER"
                                                id="container"
                                                className="peer sr-only"
                                            />
                                        </FormControl>
                                        <FormLabel
                                            htmlFor="container"
                                            className={cn(
                                                'group relative flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-all',
                                                'border-border bg-card hover:border-primary/50',
                                                'peer-data-[state=checked]:border-primary',
                                            )}
                                        >
                                            <Box
                                                className={cn(
                                                    'size-7 shrink-0 transition-colors',
                                                    isSwarmActive
                                                        ? 'text-muted-foreground group-hover:text-primary'
                                                        : 'text-muted-foreground/50',
                                                )}
                                            />
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold">
                                                    {t('container')}
                                                </span>
                                                <span className="text-muted-foreground text-sm">
                                                    {t('singleContainer')}
                                                </span>
                                            </div>
                                        </FormLabel>
                                    </FormItem>

                                    <FormItem>
                                        <FormControl>
                                            <RadioGroupItem
                                                value="SWARM"
                                                id="swarm"
                                                className="peer sr-only"
                                                disabled={!isSwarmActive}
                                            />
                                        </FormControl>
                                        <FormLabel
                                            htmlFor="swarm"
                                            className={cn(
                                                'group relative flex items-center gap-4 rounded-lg border-2 p-4 transition-all',
                                                isSwarmActive
                                                    ? 'border-border bg-card hover:border-primary/50 peer-data-[state=checked]:border-primary cursor-pointer'
                                                    : 'border-border bg-muted/30 cursor-not-allowed opacity-60',
                                            )}
                                        >
                                            <Layers
                                                className={cn(
                                                    'size-7 shrink-0 transition-colors',
                                                    isSwarmActive
                                                        ? 'text-muted-foreground group-hover:text-primary'
                                                        : 'text-muted-foreground/50',
                                                )}
                                            />
                                            <div className="flex flex-1 flex-col gap-1">
                                                <span className="font-semibold">{t('swarm')}</span>
                                                <span className="text-muted-foreground text-sm">
                                                    {t('swarmWithReplicas')}
                                                </span>
                                                {!isSwarmActive && (
                                                    <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 dark:border-amber-900/50 dark:bg-amber-950/20">
                                                        <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500" />
                                                        <span className="text-xs text-amber-900 dark:text-amber-200">
                                                            {t('swarmNotActive')}{' '}
                                                            <Link
                                                                href="/swarm"
                                                                className="font-medium underline hover:no-underline"
                                                            >
                                                                {t('initializeSwarm')}
                                                            </Link>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
