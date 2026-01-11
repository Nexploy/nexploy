import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Switch } from '@workspace/ui/components/switch';
import { CloudflareDomainSelector } from '@/components/repositories/tabs/domains/CloudflareDomainSelector';
import { useTranslations } from 'next-intl';

interface DomainFieldsProps<T extends FieldValues> {
    form: UseFormReturn<T>;
    index: number;
    isCloudflareConnected: boolean;
}

export function DomainFields<T extends FieldValues>({
    form,
    index,
    isCloudflareConnected,
}: DomainFieldsProps<T>) {
    const t = useTranslations('repository.settings.domains');
    const cloudflareZoneId = form.watch(`domains.${index}.cloudflareZoneId` as Path<T>);

    return (
        <div className="grid gap-4">
            <CloudflareDomainSelector
                form={form}
                index={index}
                isCloudflareConnected={isCloudflareConnected}
            />

            <div className="grid items-start gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name={`domains.${index}.host` as Path<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('host')}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    value={field.value as string}
                                    placeholder="example.com"
                                    className="font-mono"
                                    readOnly={!!cloudflareZoneId}
                                    disabled={!!cloudflareZoneId}
                                />
                            </FormControl>
                            {cloudflareZoneId ? (
                                <FormDescription>
                                    {t('managedByCloudflare')}
                                </FormDescription>
                            ) : (
                                <FormMessage />
                            )}
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name={`domains.${index}.path` as Path<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('path')}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    value={field.value as string}
                                    placeholder="/"
                                    className="font-mono"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name={`domains.${index}.internalPath` as Path<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('internalPath')}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    value={field.value as string}
                                    placeholder="/"
                                    className="font-mono"
                                />
                            </FormControl>
                            <FormDescription>
                                {t('internalPathDescription')}
                            </FormDescription>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name={`domains.${index}.containerPort` as Path<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('containerPort')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="3000"
                                    className="font-mono"
                                    value={field.value as number}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        field.onChange(value === '' ? 0 : parseInt(value, 10));
                                    }}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                />
                            </FormControl>
                            <FormDescription>
                                {t('containerPortDescription')}
                            </FormDescription>
                        </FormItem>
                    )}
                />
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
                <FormField
                    control={form.control}
                    name={`domains.${index}.stripPath` as Path<T>}
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-3">
                            <FormControl>
                                <Switch
                                    checked={field.value as boolean}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div>
                                <FormLabel className="cursor-pointer">{t('stripPath')}</FormLabel>
                                <FormDescription>
                                    {t('stripPathDescription')}
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name={`domains.${index}.https` as Path<T>}
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-3">
                            <FormControl>
                                <Switch
                                    checked={field.value as boolean}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div>
                                <FormLabel className="cursor-pointer">{t('https')}</FormLabel>
                                <FormDescription>
                                    {t('httpsDescription')}
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}
