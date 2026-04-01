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
import { Switch } from '@workspace/ui/components/switch';

export function UploadArtifactConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="endpoint"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('s3Endpoint')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="s3.amazonaws.com"
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="bucket"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('s3Bucket')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="my-artifacts"
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="accessKey"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('s3AccessKey')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="AKIAIOSFODNN7EXAMPLE"
                                className="border-border bg-background text-foreground focus:border-primary h-8 font-mono text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="secretKey"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('s3SecretKey')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                type="password"
                                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                                className="border-border bg-background text-foreground focus:border-primary h-8 font-mono text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="sourcePath"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('artifactSourcePath')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="dist/"
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="destinationPath"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('artifactDestinationPath')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="builds/v1.0.0/"
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="useSSL"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                        <FormLabel>{t('useSSL')}</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    );
}
