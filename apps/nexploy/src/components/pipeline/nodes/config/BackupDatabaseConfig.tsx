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

export function BackupDatabaseConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="dbType"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('dbType')}</FormLabel>
                        <Select {...field} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="postgres">PostgreSQL</SelectItem>
                                <SelectItem value="mysql">MySQL</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('host')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="localhost"
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('port')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                type="number"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="database"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('dbName')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="mydb"
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('dbUsername')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="postgres"
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('dbPassword')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                type="password"
                                placeholder="••••••••"
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="outputPath"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('backupOutputPath')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="/backups"
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
