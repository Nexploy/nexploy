'use client';

import * as React from 'react';
import { ReactNode, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Button } from '@workspace/ui/components/button';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { Separator } from '@workspace/ui/components/separator';
import '@xterm/xterm/css/xterm.css';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Input } from '@workspace/ui/components/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { statusMap } from '@/utils/statusMap';
import { Terminal } from 'lucide-react';
import { useTerminalStore } from '@/stores/useTerminalStore';
import { useLocalStorage } from 'usehooks-ts';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';
import { useTranslations } from 'next-intl';

interface ContainerTerminalProps {
    children: (props: { openConsole: () => void }) => ReactNode;
}

const shellKeys = ['auto', 'bash', 'sh', 'ash', 'dash'] as const;

export function ContainerTerminal({ children }: ContainerTerminalProps) {
    const [open, setOpen] = useState(false);
    const [selectedShell, setSelectedShell] = useLocalStorage('terminal-selectedShell', 'auto');
    const [selectedUser, setSelectedUser] = useLocalStorage('terminal-selectedUser', '');
    const t = useTranslations('docker.containerTerminal');
    const tStatus = useTranslations('docker.status');

    const container = useContainerStore((state) => state.container);
    const selectedEnvironmentId = useEnvironmentStore((state) => state.selectedEnvironmentId);

    const { connectionState, connect, disconnect, terminalRef } = useTerminalStore();

    const buildSocketUrl = (shell: string, user?: string) => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const baseUrl = `${protocol}//${window.location.host}/api/ws/docker/terminal/${container?.id}/${shell}`;
        const params = new URLSearchParams();
        if (selectedEnvironmentId) params.set('environment', selectedEnvironmentId);
        const resolvedUser = user !== undefined ? user : selectedUser;
        if (resolvedUser) params.set('user', resolvedUser);
        const query = params.toString();
        return query ? `${baseUrl}?${query}` : baseUrl;
    };

    const socketUrl = buildSocketUrl(selectedShell);

    const handleOpen = async () => {
        setOpen(true);
        await connect(buildSocketUrl(selectedShell));
    };

    const handleClose = () => {
        setOpen(false);
        disconnect();
    };

    const handleReconnection = async () => {
        disconnect();
        await connect(socketUrl);
    };

    const onValueChange = async (shellCommand: string) => {
        setSelectedShell(shellCommand);
        disconnect();
        await connect(buildSocketUrl(shellCommand));
    };

    const onUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedUser(e.target.value);
    };

    const onUserKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    const onUserBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        disconnect();
        await connect(buildSocketUrl(selectedShell, e.target.value));
    };

    const currentStatus = statusMap[connectionState];
    const isConnected = connectionState === 'connected';

    return (
        <>
            {children({ openConsole: handleOpen })}
            <Dialog open={open} modal onOpenChange={handleClose}>
                <DialogContent
                    showCloseButton={false}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    aria-describedby={undefined}
                    className="gap-0 overflow-hidden border border-neutral-800 bg-black p-0 sm:max-w-5/6"
                >
                    <DialogHeader className="flex flex-row items-center justify-between overflow-hidden border-b border-neutral-800 p-2 pl-3">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <DialogTitle className="flex items-center gap-2 overflow-hidden text-sm text-white">
                                <div className="flex size-4 shrink-0 items-center">
                                    <Terminal />
                                </div>
                                <span className="truncate">
                                    {t('title', { name: container?.name ?? 'Unknown Container' })}
                                </span>
                            </DialogTitle>
                            <Status
                                className="shrink-0 rounded-none bg-transparent"
                                status={currentStatus.status}
                            >
                                <StatusIndicator />
                                <StatusLabel className={currentStatus.text}>
                                    {tStatus(currentStatus.labelKey)}
                                </StatusLabel>
                            </Status>
                        </div>
                        <div className="flex flex-row items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Input
                                        value={selectedUser}
                                        onChange={onUserChange}
                                        onKeyDown={onUserKeyDown}
                                        onBlur={onUserBlur}
                                        placeholder={t('userPlaceholder')}
                                        className="!h-7 w-36 bg-white/10 text-xs text-white/90 placeholder:text-white/40"
                                    />
                                </TooltipTrigger>
                                <TooltipContent>{t('userPlaceholder')}</TooltipContent>
                            </Tooltip>
                            <Select value={selectedShell} onValueChange={onValueChange}>
                                <SelectTrigger className="!h-7 bg-white/10 text-white/90">
                                    <SelectValue placeholder={t('shellPlaceholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>{t('shellLabel')}</SelectLabel>
                                        {shellKeys.map((shell) => (
                                            <SelectItem key={shell} value={shell}>
                                                {t(`shells.${shell}`)}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={handleReconnection}
                                className="h-7 text-xs"
                                disabled={isConnected}
                                variant="white"
                                size="sm"
                            >
                                {t('reconnect')}
                            </Button>
                            <Separator
                                orientation="vertical"
                                className="!h-5 border-white bg-white/50"
                            />
                            <Button
                                onClick={handleClose}
                                className="h-7 text-xs"
                                variant="white"
                                size="sm"
                            >
                                {t('close')}
                            </Button>
                        </div>
                    </DialogHeader>

                    <div ref={terminalRef} className="m-1 h-[400px]" />
                </DialogContent>
            </Dialog>
        </>
    );
}
