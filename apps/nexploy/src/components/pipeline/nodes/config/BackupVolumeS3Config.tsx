'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
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
import { type AwsAccountInfo } from '@workspace/typescript-interface/aws/aws';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { findAncestor } from '@/inngest/pipeline/utils/graphQueries';
import { useEnvironmentVolumes } from '@/hooks/sse/useEnvironmentVolumes';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { Input } from '@workspace/ui/components/input';

export function BackupVolumeS3Config() {
    const t = useTranslations('repository.pipeline.config');
    const tAdmin = useTranslations('admin');
    const form = useFormContext();

    const { nodes, edges } = usePipelineContext();
    const panelNodeId = usePipelineEditorStore((s) => s.panelNodeId);

    const environmentId = useMemo(() => {
        if (!panelNodeId) return null;
        const ancestor = findAncestor(
            panelNodeId,
            nodes,
            edges,
            (data) => data.nodeType === 'set-environment' && !data.disabled,
        );
        return ancestor?.data.config?.environmentId;
    }, []);

    const { volumes, isLoading } = useEnvironmentVolumes(environmentId);
    const { data: awsAccounts = [] } = useSWR<AwsAccountInfo[]>('/api/aws/accounts', fetcherApi);

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="volumeName"
                render={({ field }) => {
                    const isStale =
                        !isLoading &&
                        !!field.value &&
                        volumes.length >= 0 &&
                        !volumes.find((v) => v.name === field.value);

                    return (
                        <FormItem>
                            <FormLabel>{t('volume')}</FormLabel>
                            <FormControl>
                                <Select
                                    value={field.value ?? ''}
                                    onValueChange={field.onChange}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger
                                        className={
                                            'w-full overflow-hidden data-[placeholder]:!pl-3'
                                        }
                                    >
                                        {isLoading ? (
                                            <span className="text-muted-foreground flex items-center gap-2">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                {t('volumesLoading')}
                                            </span>
                                        ) : isStale ? (
                                            <span className="flex items-center gap-1.5 pl-3">
                                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                                {field.value ?? t('volumeUnavailable')}
                                            </span>
                                        ) : (
                                            <SelectValue placeholder={t('volumeNamePlaceholder')} />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>{t('volumesSelectLabel')}</SelectLabel>
                                            {volumes.length === 0 ? (
                                                <div className="text-muted-foreground px-2 py-1.5">
                                                    {t('noVolumesFound')}
                                                </div>
                                            ) : (
                                                volumes.map((v) => (
                                                    <SelectItem key={v.name} value={v.name}>
                                                        <p className={'truncate'}>{v.name}</p>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            {isStale && (
                                <p className="flex items-start gap-1 text-xs text-amber-500">
                                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                                    {t('volumeStaleWarning')}
                                </p>
                            )}
                            <FormMessage className="text-xs" />
                        </FormItem>
                    );
                }}
            />

            <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{tAdmin('awsAccount')}</FormLabel>
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={tAdmin('selectAwsAccount')} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{tAdmin('awsAccount')}</SelectLabel>
                                    {awsAccounts.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.displayName} — {a.region}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="bucket"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('s3BucketName')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder={tAdmin('s3BucketNamePlaceholder')} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
