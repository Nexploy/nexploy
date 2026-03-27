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
import { Input } from '@workspace/ui/components/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import { Status, StatusIndicator } from '@workspace/ui/components/kibo-ui/status';
import * as React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

function stripLeadingSlash(name: string) {
    return name.startsWith('/') ? name.slice(1) : name;
}

export function ContainerNameField() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    const { nodes } = usePipelineContext();
    const containers = useContainersStore((s) => s.containers);

    const hasEnvironmentNode = nodes.some(
        (n) => n.data.nodeType === 'set-environment' && !n.data.disabled,
    );

    return (
        <FormField
            control={form.control}
            name="containerId"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('containerName')}</FormLabel>
                    <FormControl>
                        {hasEnvironmentNode ? (
                            <Select value={field.value ?? ''} onValueChange={field.onChange}>
                                <SelectTrigger className={'!pl-0 data-[placeholder]:!pl-3'}>
                                    <SelectValue placeholder={t('containerNamePlaceholder')} />
                                </SelectTrigger>
                                <SelectContent className={''}>
                                    {containers.length === 0 ? (
                                        <div className="text-muted-foreground px-2 py-1.5 text-xs">
                                            {t('noContainersFound')}
                                        </div>
                                    ) : (
                                        containers.map((container) => {
                                            const name = stripLeadingSlash(container.name);

                                            return (
                                                <SelectItem
                                                    key={container.id}
                                                    value={container.id}
                                                    className="pl-0 text-xs"
                                                >
                                                    <Status
                                                        className={
                                                            'm-0 max-w-72 rounded-none border-0 p-0 pl-2.5'
                                                        }
                                                        status={
                                                            container.state === 'running'
                                                                ? 'online'
                                                                : 'offline'
                                                        }
                                                        variant="outline"
                                                    >
                                                        <StatusIndicator className={'pl-2'} />
                                                        {name.length >= 50 ? (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span className={'truncate'}>
                                                                        {name}
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <span className={'truncate'}>
                                                                        {name}
                                                                    </span>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ) : (
                                                            <span className={'truncate'}>
                                                                {name}
                                                            </span>
                                                        )}
                                                    </Status>
                                                </SelectItem>
                                            );
                                        })
                                    )}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                {...field}
                                placeholder={t('containerNamePlaceholder')}
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        )}
                    </FormControl>
                    <FormMessage className="text-xs" />
                </FormItem>
            )}
        />
    );
}
