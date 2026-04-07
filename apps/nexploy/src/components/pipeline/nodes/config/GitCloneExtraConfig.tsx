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

export function GitCloneExtraConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="repoUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('gitCloneUrl')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="https://github.com/org/repo.git" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('cloneBranch')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="main" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="targetDir"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('gitCloneTargetDir')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="extra-repo" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('gitCloneToken')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                type="password"
                                value={field.value ?? ''}
                                placeholder={t('gitCloneTokenPlaceholder')}
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
