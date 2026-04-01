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

export function RunMigrationConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('migrationImage')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="my-app:latest"
                                className="border-border bg-background text-foreground focus:border-primary h-8 font-mono text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="command"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('migrationCommand')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="npx prisma migrate deploy"
                                className="border-border bg-background text-foreground focus:border-primary h-8 font-mono text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="databaseUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('migrationDatabaseUrl')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                type="password"
                                placeholder="postgresql://user:pass@host:5432/db"
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
                                value={field.value ?? ''}
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
