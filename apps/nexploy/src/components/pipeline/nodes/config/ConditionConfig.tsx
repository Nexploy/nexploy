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

export function ConditionConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('conditionKey')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="imageName"
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="operator"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('conditionOperator')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="equals">{t('operatorEquals')}</SelectItem>
                                <SelectItem value="not-equals">{t('operatorNotEquals')}</SelectItem>
                                <SelectItem value="contains">{t('operatorContains')}</SelectItem>
                                <SelectItem value="starts-with">{t('operatorStartsWith')}</SelectItem>
                                <SelectItem value="ends-with">{t('operatorEndsWith')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('conditionValue')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="expected-value"
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
