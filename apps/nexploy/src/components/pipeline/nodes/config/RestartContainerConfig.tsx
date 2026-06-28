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
import { Status, StatusIndicator } from '@workspace/ui/components/kibo-ui/status';
import { useEnvironmentContainers } from '@/hooks/sse/useEnvironmentContainers';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware.tsx';
import { usePipelineEnvironmentId } from '@/hooks/pipeline/usePipelineEnvironmentId.ts';

export function RestartContainerConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    const environmentId = usePipelineEnvironmentId();
    const { containers, isLoading } = useEnvironmentContainers(environmentId);

    return (
        <FormField
            control={form.control}
            name="containerId"
            render={({ field }) => {
                const isStale =
                    !isLoading &&
                    !!field.value &&
                    containers.length >= 0 &&
                    !containers.find((container) => container.id === field.value);

                return (
                    <FormItem>
                        <FormLabel>{t('container')}</FormLabel>
                        <FormControl>
                            <RefAware
                                className={'truncate'}
                                value={field.value}
                                onChange={field.onChange}
                            >
                                <Select
                                    {...field}
                                    onValueChange={field.onChange}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger
                                        className={
                                            'w-full overflow-hidden pl-0! data-[placeholder]:pl-3!'
                                        }
                                    >
                                        {isLoading ? (
                                            <span className="text-muted-foreground flex items-center gap-2 pl-2">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                {t('containersLoading')}
                                            </span>
                                        ) : isStale ? (
                                            <span className="flex items-center gap-1.5 pl-3">
                                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                                {t('containerUnavailable')}
                                            </span>
                                        ) : (
                                            <SelectValue
                                                placeholder={t('containerNamePlaceholder')}
                                            />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>{t('containersSelectLabel')}</SelectLabel>
                                            {containers.length === 0 ? (
                                                <span className="text-muted-foreground px-2 py-1.5 text-sm">
                                                    {t('noContainersFound')}
                                                </span>
                                            ) : (
                                                containers.map((container) => (
                                                    <SelectItem
                                                        key={container.id}
                                                        value={container.id}
                                                        className="pl-0"
                                                    >
                                                        <Status
                                                            className="m-0 w-full rounded-none border-0 p-0 pl-2.5 text-sm"
                                                            status={
                                                                container.state === 'running'
                                                                    ? 'online'
                                                                    : 'offline'
                                                            }
                                                            variant="outline"
                                                        >
                                                            <StatusIndicator className="pl-2" />
                                                            <span className="truncate">
                                                                {container.name}
                                                            </span>
                                                        </Status>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                );
            }}
        />
    );
}
