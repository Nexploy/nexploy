'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
    Box,
    Container,
    FileCode2,
    Globe,
    HardDrive,
    Image,
    KeyRound,
    LayoutGrid,
    Lock,
    ShieldCheck,
    Terminal,
} from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@workspace/ui/components/form';
import { Switch } from '@workspace/ui/components/switch';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { updateAIMcpPermissionsSchema } from '@workspace/schemas-zod/ai/aiSettings.schema';
import { updateAIMcpPermissionsAction } from '@/actions/admin/ai/updateAiMcpPermissions.action';

interface McpPermissionsCardProps {
    allowExecInContainer: boolean;
    allowSwarmOperations: boolean;
    allowImagesGroup: boolean;
    allowVolumesGroup: boolean;
    allowNetworksGroup: boolean;
    allowComposeGroup: boolean;
    allowRepositoriesGroup: boolean;
    allowRegistriesGroup: boolean;
    allowSslGroup: boolean;
    allowEnvironmentsGroup: boolean;
}

type PermissionField = keyof Omit<McpPermissionsCardProps, never>;

interface PermissionRow {
    name: PermissionField;
    icon: React.ElementType;
}

const DOCKER_PERMISSIONS: PermissionRow[] = [
    { name: 'allowExecInContainer', icon: Terminal },
    { name: 'allowImagesGroup', icon: Image },
    { name: 'allowVolumesGroup', icon: HardDrive },
    { name: 'allowNetworksGroup', icon: Globe },
    { name: 'allowComposeGroup', icon: LayoutGrid },
    { name: 'allowSwarmOperations', icon: Container },
];

const NEXPLOY_PERMISSIONS: PermissionRow[] = [
    { name: 'allowRepositoriesGroup', icon: FileCode2 },
    { name: 'allowRegistriesGroup', icon: Box },
    { name: 'allowSslGroup', icon: Lock },
    { name: 'allowEnvironmentsGroup', icon: KeyRound },
];

export function McpPermissionsCard(props: McpPermissionsCardProps) {
    const t = useTranslations('ai.admin.settings');

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        updateAIMcpPermissionsAction,
        zodResolver(updateAIMcpPermissionsSchema),
        {
            formProps: { defaultValues: props },
            actionProps: {
                onError: () => toast.error(t('saveFailed')),
            },
        },
    );

    const renderRow = ({ name, icon: Icon }: PermissionRow) => (
        <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                        <div className="flex flex-col">
                            <span className="text-base">{t(`${name}`)}</span>
                            <span className="text-muted-foreground text-xs">
                                {t(`${name}Description`)}
                            </span>
                        </div>
                        <FormControl>
                            <Switch
                                checked={field.value}
                                disabled={action.isPending}
                                onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    void handleSubmitWithAction();
                                }}
                            />
                        </FormControl>
                    </FormLabel>
                </FormItem>
            )}
        />
    );

    return (
        <Card>
            <CardHeaderWithIcon
                icon={ShieldCheck}
                title={t('mcpPermissions')}
                description={t('mcpPermissionsDescription')}
            />
            <CardContent className="space-y-4">
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction} className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <p className="text-muted-foreground px-1 text-xs font-medium tracking-wider uppercase">
                                {t('mcpSectionDocker')}
                            </p>
                            <div className="flex flex-col gap-2">
                                {DOCKER_PERMISSIONS.map(renderRow)}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-muted-foreground px-1 text-xs font-medium tracking-wider uppercase">
                                {t('mcpSectionNexploy')}
                            </p>
                            <div className="flex flex-col gap-2">
                                {NEXPLOY_PERMISSIONS.map(renderRow)}
                            </div>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
