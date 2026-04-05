'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';

export const NETWORK_SCOPES = ['local', 'global', 'swarm'] as const;

interface NetworkScopeSelectProps {
    name?: string;
    messageClassName?: string;
}

export function NetworkScopeSelect({ name = 'scope', messageClassName }: NetworkScopeSelectProps) {
    const t = useTranslations('docker.networkScope');
    const tScopes = useTranslations('docker.scopes');
    const form = useFormContext();

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('scope')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={t('selectScope')} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {NETWORK_SCOPES.map((scope) => (
                                <SelectItem key={scope} value={scope}>
                                    {tScopes(scope)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage className={messageClassName} />
                    <FormDescription>{t('scopeDescription')}</FormDescription>
                </FormItem>
            )}
        />
    );
}
