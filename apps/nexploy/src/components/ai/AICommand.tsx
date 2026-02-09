'use client';

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from '@workspace/ui/components/command';
import {
    Container,
    Database,
    FileIcon,
    Layers,
    LayoutList,
    Play,
    Settings,
    Sparkles,
    Square,
    Terminal,
    Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Kbd } from '@workspace/ui/components/kbd';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Dialog, DialogContent } from '@workspace/ui/components/dialog';
import { AICommandChat } from '@/components/ai/AICommandChat';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

export function AICommand() {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<'command' | 'chat'>('command');
    const [inputValue, setInputValue] = useState('');
    const router = useRouter();
    const t = useTranslations('ai.command');
    const tNav = useTranslations('ai.commandGroups');

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
                setView('command');
                setInputValue('');
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    const openCloseDialog = () => {
        if (open) {
            setOpen(false);
        } else {
            setOpen(true);
            setView('command');
            setInputValue('');
        }
    };

    const handleChatSelect = () => {
        setView('chat');
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={openCloseDialog}
                className="hover:bg-muted hover:text-foreground text-muted-foreground flex h-8 flex-1 justify-between !pr-2 text-sm font-normal shadow-none md:flex-none"
            >
                <span className={'truncate'}>{t('searchPlaceholder')}</span>
                <Kbd className={'px-1'}>⌘K</Kbd>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="overflow-hidden p-0 shadow-lg sm:max-w-[600px]">
                    {view === 'command' ? (
                        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
                            <CommandInput
                                placeholder={t('searchPlaceholder')}
                                value={inputValue}
                                onValueChange={setInputValue}
                            />
                            <CommandList>
                                <CommandEmpty>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start"
                                        onClick={handleChatSelect}
                                    >
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        {t('askAi', { query: inputValue })}
                                    </Button>
                                </CommandEmpty>
                                <ScrollArea className="flex max-h-72 flex-col overflow-y-auto">
                                    {inputValue && (
                                        <CommandGroup heading={t('aiAssistant')}>
                                            <CommandItem onSelect={handleChatSelect}>
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                <span>{t('askAi', { query: inputValue })}</span>
                                            </CommandItem>
                                        </CommandGroup>
                                    )}

                                    <CommandGroup heading={tNav('navigation')}>
                                        <CommandItem
                                            onSelect={() =>
                                                runCommand(() => router.push('/docker/containers'))
                                            }
                                        >
                                            <Container className="mr-2 h-4 w-4" />
                                            <span>Containers</span>
                                            <CommandShortcut>⌘C</CommandShortcut>
                                        </CommandItem>
                                        <CommandItem
                                            onSelect={() =>
                                                runCommand(() => router.push('/docker/images'))
                                            }
                                        >
                                            <LayoutList className="mr-2 h-4 w-4" />
                                            <span>Images</span>
                                            <CommandShortcut>⌘I</CommandShortcut>
                                        </CommandItem>
                                        <CommandItem
                                            onSelect={() =>
                                                runCommand(() => router.push('/docker/volumes'))
                                            }
                                        >
                                            <Database className="mr-2 h-4 w-4" />
                                            <span>Volumes</span>
                                            <CommandShortcut>⌘V</CommandShortcut>
                                        </CommandItem>
                                    </CommandGroup>

                                    <CommandSeparator />

                                    <CommandGroup heading={t('quickActions')}>
                                        <CommandItem
                                            onSelect={() =>
                                                runCommand(() =>
                                                    router.push(
                                                        '/docker/containers/create-container',
                                                    ),
                                                )
                                            }
                                        >
                                            <Container className="mr-2 h-4 w-4" />
                                            <span>{t('createContainer')}</span>
                                        </CommandItem>
                                        <CommandItem
                                            onSelect={() =>
                                                runCommand(() =>
                                                    router.push('/docker/images/pull-image'),
                                                )
                                            }
                                        >
                                            <FileIcon className="mr-2 h-4 w-4" />
                                            <span>{t('pullImage')}</span>
                                        </CommandItem>
                                        <CommandItem
                                            onSelect={() =>
                                                runCommand(() => console.log('Create volume'))
                                            }
                                        >
                                            <Database className="mr-2 h-4 w-4" />
                                            <span>{t('createVolume')}</span>
                                        </CommandItem>
                                    </CommandGroup>

                                    <CommandSeparator />

                                    <CommandGroup heading={tNav('containers')}>
                                        <CommandItem
                                            onSelect={() =>
                                                runCommand(() => console.log('Start all'))
                                            }
                                        >
                                            <Play className="mr-2 h-4 w-4" />
                                            <span>{t('startAll')}</span>
                                        </CommandItem>
                                        <CommandItem
                                            onSelect={() =>
                                                runCommand(() => console.log('Stop all'))
                                            }
                                        >
                                            <Square className="mr-2 h-4 w-4" />
                                            <span>{t('stopAll')}</span>
                                        </CommandItem>
                                        <CommandItem
                                            onSelect={() =>
                                                runCommand(() => console.log('Remove stopped'))
                                            }
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>{t('removeStopped')}</span>
                                        </CommandItem>
                                    </CommandGroup>

                                    <CommandSeparator />

                                    <CommandGroup heading={tNav('stacks')}>
                                        <CommandItem
                                            onSelect={() =>
                                                runCommand(() => console.log('View stacks'))
                                            }
                                        >
                                            <Layers className="mr-2 h-4 w-4" />
                                            <span>{t('viewStacks')}</span>
                                        </CommandItem>
                                    </CommandGroup>

                                    <CommandSeparator />

                                    <CommandGroup heading={t('system')}>
                                        <CommandItem
                                            onSelect={() =>
                                                runCommand(() => console.log('Settings'))
                                            }
                                        >
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>{t('settings')}</span>
                                            <CommandShortcut>⌘,</CommandShortcut>
                                        </CommandItem>
                                        <CommandItem
                                            onSelect={() =>
                                                runCommand(() => console.log('Terminal'))
                                            }
                                        >
                                            <Terminal className="mr-2 h-4 w-4" />
                                            <span>{t('openTerminal')}</span>
                                            <CommandShortcut>⌘T</CommandShortcut>
                                        </CommandItem>
                                    </CommandGroup>
                                </ScrollArea>
                            </CommandList>
                        </Command>
                    ) : (
                        <AICommandChat
                            initialInput={inputValue}
                            onBack={() => setView('command')}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
