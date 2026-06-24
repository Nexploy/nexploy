'use client';

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
import { Input } from '@workspace/ui/components/input';
import { type AwsAccountInfo } from '@workspace/typescript-interface/aws/aws';
import { useEnvironmentVolumes } from '@/hooks/sse/useEnvironmentVolumes';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { isNodeFieldRef } from '@/lib/nodeFieldRef';
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';
import { usePipelineEnvironmentId } from '@/hooks/pipeline/usePipelineEnvironmentId.ts';

export function BackupVolumeS3Config() {
    const t = useTranslations('repository.pipeline.config');
    const tAdmin = useTranslations('admin');
    const form = useFormContext();

    const environmentId = usePipelineEnvironmentId();
    const { volumes, isLoading } = useEnvironmentVolumes(environmentId);
    const { data: awsAccounts, isLoading: isLoadingAccounts } = useSWR<AwsAccountInfo[]>(
        { url: '/api/aws/accounts' },
        fetcherApi,
    );
    const awsAccountList = awsAccounts ?? [];

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
                        <FormItem className={'flex flex-col'}>
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
                                            <SelectTrigger className="w-full min-w-40 data-[placeholder]:!pl-3">
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
                name="accountId"
                render={({ field }) => {
                    const isStaleAccount =
                        !isLoadingAccounts &&
                        !!field.value &&
                        !awsAccountList.find((a) => a.id === field.value);

                    return (
                        <FormItem>
                            <FormLabel>{tAdmin('awsAccount')}</FormLabel>
                            <FormControl>
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={isLoadingAccounts}
                                >
                                    <SelectTrigger className="w-full overflow-hidden data-[placeholder]:!pl-3">
                                        {isLoadingAccounts ? (
                                            <span className="text-muted-foreground flex items-center gap-2">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                {tAdmin('awsAccountsLoading')}
                                            </span>
                                        ) : isStaleAccount ? (
                                            <span className="flex items-center gap-1.5">
                                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                                {tAdmin('awsAccountUnavailable')}
                                            </span>
                                        ) : (
                                            <SelectValue placeholder={tAdmin('selectAwsAccount')} />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>{tAdmin('awsAccount')}</SelectLabel>
                                            {awsAccountList.length === 0 ? (
                                                <span className="text-muted-foreground px-2 py-1.5 text-sm">
                                                    {tAdmin('noAwsAccounts')}
                                                </span>
                                            ) : (
                                                awsAccountList.map((a) => (
                                                    <SelectItem key={a.id} value={a.id}>
                                                        {a.displayName} — {a.region}
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
                name="bucket"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('s3BucketName')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder={tAdmin('s3BucketNamePlaceholder')} />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
