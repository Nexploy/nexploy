'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Loader2, Trash2 } from 'lucide-react';
import { ComponentProps } from 'react';
import { toast } from 'sonner';
import { onRemoveBuild } from '@/actions/repository/builds/removeBuild.action';

interface RemoveBuildButtonProps extends ComponentProps<typeof Button> {
    buildId: string;
}

export function RemoveBuildButton({ buildId, ...props }: RemoveBuildButtonProps) {
    const { execute, isPending } = useAction(onRemoveBuild, {
        onSuccess: () => {
            toast.success('Build removed successfully');
        },
    });

    const handleRemove = async () => {
        execute({ buildId });
    };

    return (
        <Button {...props} onClick={handleRemove} variant={'destructive'} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
        </Button>
    );
}
