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
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';

export function WaitForUrlConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('url')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="https://example.com/health" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('httpMethod')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{t('httpMethod')}</SelectLabel>
                                    <SelectItem value="GET">GET</SelectItem>
                                    <SelectItem value="POST">POST</SelectItem>
                                    <SelectItem value="HEAD">HEAD</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="expectedStatus"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('expectedStatus')}</FormLabel>
                        <FormControl>
                            <Input {...field} type="number" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="timeout"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('timeoutSeconds')}</FormLabel>
                        <FormControl>
                            <Input {...field} type="number" min={1} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="interval"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('intervalSeconds')}</FormLabel>
                        <FormControl>
                            <Input {...field} type="number" min={1} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
