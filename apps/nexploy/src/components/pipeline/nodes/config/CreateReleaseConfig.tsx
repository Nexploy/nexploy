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
import { Textarea } from '@workspace/ui/components/textarea';
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
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';

export function CreateReleaseConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    const provider = form.watch('provider');

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('releaseProvider')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{t('releaseProvider')}</SelectLabel>
                                    <SelectItem value="github">GitHub</SelectItem>
                                    <SelectItem value="gitlab">GitLab</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('releaseToken')}</FormLabel>
                        <FormControl>
                            <Input {...field} type="password" placeholder="ghp_..." />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="owner"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('releaseOwner')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="my-org" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="repo"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('releaseRepo')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="my-repo" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            {provider === 'gitlab' && (
                <FormField
                    control={form.control}
                    name="baseUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('releaseBaseUrl')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="https://gitlab.com" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            )}
            <FormField
                control={form.control}
                name="tagName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('releaseTagName')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder={t('releaseTagNamePlaceholder')} />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="targetBranch"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('releaseTargetBranch')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder={t('releaseTargetBranchPlaceholder')} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="releaseTitle"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('releaseTitle')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder={t('releaseTitlePlaceholder')} />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="releaseNotes"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('releaseNotes')}</FormLabel>
                        <FormControl>
                            <Textarea
                                {...field}
                                placeholder={t('releaseNotesPlaceholder')}
                                rows={5}
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="draft"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                        <FormLabel>{t('releaseDraft')}</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="prerelease"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                        <FormLabel>{t('releasePrerelease')}</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
