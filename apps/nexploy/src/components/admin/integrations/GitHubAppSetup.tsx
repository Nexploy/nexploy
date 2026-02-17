'use client';

import { useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Github } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Switch } from '@workspace/ui/components/switch';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useTranslations } from 'next-intl';

const githubSetupSchema = z
    .object({
        displayName: z.string({ error: 'Display name is required' }),
        forOrg: z.boolean(),
        orgName: z.string(),
    })
    .refine((data) => !data.forOrg || data.orgName.length > 0, {
        path: ['orgName'],
        message: 'Organization name is required',
    });

type GitHubSetupValues = z.infer<typeof githubSetupSchema>;

function buildManifest(appUrl: string) {
    return {
        name: `Nexploy-${Math.random().toString(36).slice(2, 10)}`,
        url: appUrl,
        redirect_url: `${appUrl}/api/providers/github/setup`,
        callback_urls: [`${appUrl}/api/git/oauth/callback`],
        hook_attributes: {
            url: `${appUrl}/api/webhooks/github`,
        },
        public: false,
        request_oauth_on_install: true,
        default_permissions: {
            contents: 'read',
            metadata: 'read',
            administration: 'read',
        },
        default_events: ['push'],
    };
}

export function GitHubAppSetup() {
    const hiddenFormRef = useRef<HTMLFormElement>(null);
    const { closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('integrations.oauth.guide.github');
    const tOAuth = useTranslations('integrations.oauth');

    const appUrl = window.location.origin;

    const form = useForm<GitHubSetupValues>({
        resolver: zodResolver(githubSetupSchema),
        defaultValues: {
            forOrg: false,
            orgName: '',
        },
    });

    const forOrg = form.watch('forOrg');
    const displayName = form.watch('displayName');
    const orgName = form.watch('orgName');

    const effectiveDisplayName = displayName?.trim() || 'GitHub';

    const manifestJson = useMemo(() => {
        if (!appUrl) return '';
        return JSON.stringify(buildManifest(appUrl));
    }, [appUrl]);

    const target = forOrg
        ? `https://github.com/organizations/${orgName}/settings/apps/new`
        : 'https://github.com/settings/apps/new';

    const handleCreate = () => {
        document.cookie = `github_app_display_name=${encodeURIComponent(effectiveDisplayName)}; path=/; max-age=600; SameSite=Lax`;
        hiddenFormRef.current?.setAttribute('action', target);
        hiddenFormRef.current?.submit();
        closeDialog();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{tOAuth('displayName')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder={tOAuth('displayNamePlaceholder')} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="forOrg"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-3">
                            <FormControl>
                                <Switch
                                    className="cursor-pointer"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <FormLabel className="!mt-0 cursor-pointer">
                                {t('organization')}
                            </FormLabel>
                        </FormItem>
                    )}
                />

                {forOrg && (
                    <FormField
                        control={form.control}
                        name="orgName"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input {...field} placeholder={t('organizationPlaceholder')} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <form ref={hiddenFormRef} action={target} method="post" className="hidden">
                    <input type="hidden" name="manifest" value={manifestJson} />
                </form>

                <div className="flex justify-end">
                    <Button type="submit" icon={Github}>
                        {t('createApp')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
