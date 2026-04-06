'use client';

import { useEffect, useState } from 'react';
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
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { type AwsAccountInfo } from '@workspace/typescript-interface/aws/aws';
import { useVolumeStore } from '@/stores/docker/useVolumeStore';

export function BackupVolumeS3Config() {
    const t = useTranslations('repository.pipeline.config');
    const tAdmin = useTranslations('admin');
    const form = useFormContext();

    const volumes = useVolumeStore((s) => s.volumes);
    const [awsAccounts, setAwsAccounts] = useState<AwsAccountInfo[]>([]);

    useEffect(() => {
        fetch('/api/aws/accounts')
            .then((r) => r.json())
            .then(setAwsAccounts)
            .catch(() => {});
    }, []);

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="volumeName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('volumeName')}</FormLabel>
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('volumeNamePlaceholder')} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{t('volumeName')}</SelectLabel>
                                    {volumes.map((v) => (
                                        <SelectItem key={v.name} value={v.name}>
                                            {v.name}
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
