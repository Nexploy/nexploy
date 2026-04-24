'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select.tsx';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Status, StatusIndicator } from '@workspace/ui/components/kibo-ui/status';
import { useEnvironmentContainers } from '@/hooks/sse/useEnvironmentContainers.ts';

export function RunCommandInContainerConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    const { containers, isLoading } = useEnvironmentContainers();

    return (
        <div className="space-y-4">
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
                            <FormLabel>{t('containerId')}</FormLabel>
                            <FormControl>
                                <Select
                                    {...field}
                                    onValueChange={field.onChange}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger
                                        className={
                                            'w-full overflow-hidden !pl-0 data-[placeholder]:!pl-3'
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
                                                            className="m-0 flex-1 rounded-none border-0 p-0 pl-2.5 text-sm"
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
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    );
                }}
            />
            <FormField
                control={form.control}
                name="command"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('command')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="npm run migrate"
                                className="border-border bg-background text-foreground focus:border-primary h-8 font-mono text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="workdir"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('workdir')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="/app"
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
