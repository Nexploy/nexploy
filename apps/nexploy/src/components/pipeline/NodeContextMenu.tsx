'use client';

import { useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useTranslations } from 'next-intl';
import { Power, Trash2 } from 'lucide-react';
import { usePipelineActions } from '@/stores/pipeline/usePipelineStore';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@workspace/ui/components/context-menu';

export interface NodeContextMenuState {
    clientX: number;
    clientY: number;
    nodeId: string;
}

interface NodeContextMenuProps {
    menu: NodeContextMenuState;
    onClose: () => void;
}

export function NodeContextMenu({ menu, onClose }: NodeContextMenuProps) {
    const t = useTranslations('repository.pipeline');
    const { deleteElements, getNodes } = useReactFlow();
    const { triggerAutoSave, setNodes } = usePipelineActions();
    const triggerRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        triggerRef.current?.dispatchEvent(
            new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                clientX: menu.clientX,
                clientY: menu.clientY,
            }),
        );
    }, [menu.clientX, menu.clientY]);

    const getTargetIds = () => {
        const selectedIds = getNodes()
            .filter((n) => n.selected)
            .map((n) => n.id);
        return selectedIds.length > 1 && selectedIds.includes(menu.nodeId)
            ? selectedIds
            : [menu.nodeId];
    };

    const targetNode = getNodes().find((n) => n.id === menu.nodeId);
    const disabled = targetNode?.data?.disabled ?? false;

    const handleDelete = () => {
        deleteElements({ nodes: getTargetIds().map((id) => ({ id })) });
        onClose();
    };

    const handleToggleDisabled = () => {
        const ids = getTargetIds();
        setNodes((nds) =>
            nds.map((n) =>
                ids.includes(n.id) ? { ...n, data: { ...n.data, disabled: !disabled } } : n,
            ),
        );
        triggerAutoSave();
        onClose();
    };

    return (
        <ContextMenu onOpenChange={(open) => !open && onClose()}>
            <ContextMenuTrigger ref={triggerRef} />
            <ContextMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
                <ContextMenuItem onClick={handleToggleDisabled}>
                    <Power className="size-3" />
                    {disabled ? t('node.enable') : t('node.disable')}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={handleDelete} variant="destructive">
                    <Trash2 className="size-3" />
                    {t('node.delete')}
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
