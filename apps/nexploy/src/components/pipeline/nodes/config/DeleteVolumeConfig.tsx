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
import { Switch } from '@workspace/ui/components/switch';
import { useEnvironmentVolumes } from '@/hooks/sse/useEnvironmentVolumes';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { isNodeFieldRef } from '@/lib/nodeFieldRef';
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';
import { usePipelineEnvironmentId } from '@/hooks/pipeline/usePipelineEnvironmentId.ts';

export function DeleteVolumeConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    const environmentId = usePipelineEnvironmentId();
    const { volumes, isLoading } = useEnvironmentVolumes(environmentId);

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="volumeName"
                render={({ field }) => {
                    const isStale =
                        !isLoading &&
                        !!field.value &&
                        !isNodeFieldRef(field.value) &&
                        !volumes.find((v) => v.name === field.value);

                    return (
                        <FormItem className="flex flex-col">
                            <FormLabel>{t('volumeName')}</FormLabel>
                            <FormControl>
                                <RefAware value={field.value} onChange={field.onChange}>
                                    {isLoading ? (
                                        <p className="text-muted-foreground bg-input/30 border-input flex h-9 items-center gap-1 rounded-md border px-3 py-2 text-sm">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            {t('volumesLoading')}
                                        </p>
                                    ) : (
                                        <Select
                                            {...field}
                                            onValueChange={field.onChange}
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger className="w-full min-w-40 data-[placeholder]:pl-3!">
                                                {isStale ? (
                                                    <span className="flex min-w-0 items-center gap-1.5">
                                                        <AlertTriangle className="h-3 w-3 shrink-0" />
                                                        <span className="truncate">
                                                            {t('volumeUnavailable')}
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <SelectValue
                                                        placeholder={t('volumeNamePlaceholder')}
                                                    />
                                                )}
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>
                                                        {t('volumesSelectLabel')}
                                                    </SelectLabel>
                                                    {volumes.length === 0 ? (
                                                        <div className="text-muted-foreground px-2 py-1.5 text-xs">
                                                            {t('noVolumesFound')}
                                                        </div>
                                                    ) : (
                                                        volumes.map((v) => (
                                                            <SelectItem key={v.name} value={v.name}>
                                                                {v.name}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </RefAware>
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    );
                }}
            />
            <FormField
                control={form.control}
                name="force"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                        <FormLabel>{t('force')}</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    );
}
