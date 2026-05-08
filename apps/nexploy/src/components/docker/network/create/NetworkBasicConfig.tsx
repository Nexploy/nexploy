'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent } from '@workspace/ui/components/card';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';
import { Settings } from 'lucide-react';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { CheckboxField } from '@/components/forms/CheckboxField';
import { NetworkScopeSelect } from '@/components/docker/network/NetworkScopeSelect';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select.tsx';
import { NETWORK_DRIVERS } from '@/lib/constants/docker.ts';

export function NetworkBasicConfig() {
    const t = useTranslations('docker.createNetworkPage');
    const form = useFormContext();

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Settings}
                title={t('basicConfig')}
                description={t('configureParams')}
            />
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('networkName')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder={t('networkNamePlaceholder')} />
                            </FormControl>
                            <FormMessage />
                            <FormDescription>{t('networkNameDescription')}</FormDescription>
                        </FormItem>
                    )}
                />

                <CheckboxField
                    control={form.control}
                    name="checkDuplicate"
                    label={t('checkDuplicate')}
                    description={t('checkDuplicateDescription')}
                />

                <FormField
                    control={form.control}
                    name={'driver'}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('driver')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectDriver')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>{t('driver')}</SelectLabel>
                                        {NETWORK_DRIVERS.map((driver) => (
                                            <SelectItem key={driver} value={driver}>
                                                {driver.charAt(0).toUpperCase() + driver.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            <FormDescription>{t('driverDescription')}</FormDescription>
                        </FormItem>
                    )}
                />

                <NetworkScopeSelect />

                <div className="space-y-4 pt-2">
                    <CheckboxField
                        control={form.control}
                        name="enableIPv4"
                        label={t('enableIPv4')}
                        description={t('enableIPv4Description')}
                    />
                    <CheckboxField
                        control={form.control}
                        name="enableIPv6"
                        label={t('enableIPv6')}
                        description={t('enableIPv6Description')}
                    />
                    <CheckboxField
                        control={form.control}
                        name="internal"
                        label={t('internalNetwork')}
                        description={t('internalNetworkDescription')}
                    />
                    <CheckboxField
                        control={form.control}
                        name="attachable"
                        label={t('attachable')}
                        description={t('attachableDescription')}
                    />
                    <CheckboxField
                        control={form.control}
                        name="ingress"
                        label={t('ingress')}
                        description={t('ingressDescription')}
                    />
                    <CheckboxField
                        control={form.control}
                        name="configOnly"
                        label={t('configOnly')}
                        description={t('configOnlyDescription')}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
