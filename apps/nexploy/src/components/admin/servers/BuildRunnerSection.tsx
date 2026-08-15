'use client';

import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { BuildRunnerInfo } from '@workspace/typescript-interface/buildRunner/buildRunner';
import { deleteBuildRunnerAction } from '@/actions/admin/buildRunner/deleteBuildRunner.action';
import { regenerateBuildRunnerTokenAction } from '@/actions/admin/buildRunner/regenerateBuildRunnerToken.action';
import { BuildRunnerCard } from '@/components/admin/servers/BuildRunnerCard';
import { EditBuildRunnerForm } from '@/components/admin/servers/EditBuildRunnerForm';
import { RunnerTokenPanel } from '@/components/admin/servers/RunnerTokenPanel';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';

interface BuildRunnerSectionProps {
    runners: BuildRunnerInfo[];
    serverUrl: string;
}

export function BuildRunnerSection({ runners, serverUrl }: BuildRunnerSectionProps) {
    const t = useTranslations('admin.buildRunners');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const { openDialog } = useConfirmationDialogStore();
    const openAlertDialog = useAlertConfirmationDialogStore((s) => s.openAlertDialog);

    const { executeAsync: deleteRunner } = useAction(deleteBuildRunnerAction, {
        onSuccess: () => {
            toast.success(t('deleteSuccess'));
            router.refresh();
        },
    });

    const { executeAsync: regenerateToken } = useAction(regenerateBuildRunnerTokenAction);

    const showTokenPanel = (token: string, runnerName: string) => {
        setTimeout(() => {
            openAlertDialog({
                title: t('tokenTitle'),
                description: <RunnerTokenPanel token={token} runnerName={runnerName} serverUrl={serverUrl} />,
                cancelLabel: tCommon('close'),
                disableActionButton: true,
                props: { className: 'sm:max-w-3xl' },
            });
        }, 0);
    };

    const handleEdit = (runner: BuildRunnerInfo) => {
        openDialog({
            title: t('editTitle'),
            description: t('editDescription', { name: runner.name }),
            content: <EditBuildRunnerForm runner={runner} />,
        });
    };

    const handleDelete = (runner: BuildRunnerInfo) => {
        openAlertDialog({
            title: t('delete'),
            description: t('confirmDelete', { name: runner.name }),
            onAction: async () => await deleteRunner({ id: runner.id }),
        });
    };

    const handleRegenerate = (runner: BuildRunnerInfo) => {
        openAlertDialog({
            title: t('regenerateToken'),
            description: t('confirmRegenerate', { name: runner.name }),
            onAction: async () => {
                const result = await regenerateToken({ id: runner.id });
                const token = result?.data?.token;

                if (!token) return;

                toast.success(t('regenerateSuccess'));
                router.refresh();
                showTokenPanel(token, runner.name);
            },
        });
    };

    return (
        <div className="flex flex-col gap-3">
            {runners.length === 0 ? (
                <div className="rounded-md border p-8 text-center text-muted-foreground text-sm">{t('noRunners')}</div>
            ) : (
                runners.map((runner) => (
                    <BuildRunnerCard
                        key={runner.id}
                        runner={runner}
                        onEdit={handleEdit}
                        onRegenerate={handleRegenerate}
                        onDelete={handleDelete}
                    />
                ))
            )}
        </div>
    );
}
