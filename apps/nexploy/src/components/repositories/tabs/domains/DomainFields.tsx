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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { CloudflareDomainSelector } from '@/components/repositories/tabs/domains/CloudflareDomainSelector';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';
import { useTranslations } from 'next-intl';
import type { CloudflareAccountInfo } from '@workspace/typescript-interface/cloudflare/cloudflare';
import { ShieldCheck } from 'lucide-react';

interface CertOption {
    id: string;
    name: string;
    type: 'LETS_ENCRYPT' | 'CUSTOM';
    domain: string;
}

interface DomainFieldsProps<T extends FieldValues> {
    form: UseFormReturn<T>;
    index: number;
    cloudflareAccounts: CloudflareAccountInfo[];
    certificates: CertOption[];
}

export function DomainFields<T extends FieldValues>({
    form,
    index,
    cloudflareAccounts,
    certificates,
}: DomainFieldsProps<T>) {
    const t = useTranslations('repository.settings.domains');
    const cloudflareZoneId = form.watch(`domains.${index}.cloudflareZoneId` as Path<T>);
    const httpsEnabled = form.watch(`domains.${index}.https` as Path<T>);
    const environments = useEnvironmentStore((s) => s.environments);

    return (
        <div className="flex flex-col gap-4 border-t border-dashed p-4">
            <FormField
                control={form.control}
                name={`domains.${index}.environmentId` as Path<T>}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('environment')}</FormLabel>
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('selectEnvironment')} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{t('environment')}</SelectLabel>
                                    {environments.map((env) => (
                                        <SelectItem key={env.id} value={env.id}>
                                            {env.name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FormDescription>{t('environmentDescription')}</FormDescription>
                    </FormItem>
                )}
            />

            <CloudflareDomainSelector
                form={form}
                index={index}
                cloudflareAccounts={cloudflareAccounts}
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
                                <FormDescription>{t('managedByCloudflare')}</FormDescription>
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
                            <FormDescription>{t('internalPathDescription')}</FormDescription>
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
                            <FormDescription>{t('containerPortDescription')}</FormDescription>
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
                                <FormDescription>{t('stripPathDescription')}</FormDescription>
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
                                    onCheckedChange={(checked) => {
                                        field.onChange(checked);
                                        if (!checked) {
                                            form.setValue(
                                                `domains.${index}.certificateId` as Path<T>,
                                                undefined as never,
                                            );
                                        }
                                    }}
                                />
                            </FormControl>
                            <div>
                                <FormLabel className="cursor-pointer">{t('https')}</FormLabel>
                                <FormDescription>{t('httpsDescription')}</FormDescription>
                            </div>
                        </FormItem>
                    )}
                />
            </div>

            {httpsEnabled && (
                <FormField
                    control={form.control}
                    name={`domains.${index}.certificateId` as Path<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('certificate')}</FormLabel>
                            <Select
                                value={field.value ?? ''}
                                onValueChange={(val) => field.onChange(val || undefined)}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectCertificate')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {certificates.length === 0 ? (
                                        <div className="text-muted-foreground px-2 py-4 text-center text-sm">
                                            {t('noCertificates')}
                                        </div>
                                    ) : (
                                        certificates.map((cert) => (
                                            <SelectItem key={cert.id} value={cert.id}>
                                                <span className="flex items-center gap-2">
                                                    <ShieldCheck className="text-primary" />
                                                    <span>{cert.name}</span>
                                                    <span className="text-muted-foreground font-mono text-xs">
                                                        {cert.domain}
                                                    </span>
                                                </span>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <FormDescription>{t('certificateDescription')}</FormDescription>
                        </FormItem>
                    )}
                />
            )}
        </div>
    );
}
