'use client';

import * as React from 'react';
import {
    CommandDialog,
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
    Square,
    Terminal,
    Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Kbd } from '@workspace/ui/components/kbd';
import { ScrollArea } from '@workspace/ui/components/scroll-area';

export function AICommand() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    const openCloseDialog = () => {
        if (open) {
            setOpen(false);
        } else {
            setOpen(true);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={openCloseDialog}
                className="hover:bg-muted hover:text-foreground text-muted-foreground flex h-8 flex-1 justify-between !pr-2 text-sm font-normal shadow-none md:w-1/4 md:flex-none"
            >
                <span className={'truncate'}>Tapez une commande ou recherchez...</span>
                <Kbd>⌘ K</Kbd>
            </Button>
            <CommandDialog
                open={open}
                onOpenChange={setOpen}
                title="Command Menu"
                description="Tapez une commande ou recherchez..."
            >
                <CommandInput placeholder="Tapez une commande ou recherchez..." />
                <CommandList>
                    <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
                    <ScrollArea className="flex max-h-72 flex-col overflow-y-auto">
                        <CommandGroup heading="Navigation">
                            <CommandItem
                                onSelect={() => runCommand(() => router.push('/docker/containers'))}
                            >
                                <Container />
                                <span>Containers</span>
                                <CommandShortcut>⌘C</CommandShortcut>
                            </CommandItem>
                            <CommandItem
                                onSelect={() => runCommand(() => router.push('/docker/images'))}
                            >
                                <LayoutList />
                                <span>Images</span>
                                <CommandShortcut>⌘I</CommandShortcut>
                            </CommandItem>
                            <CommandItem
                                onSelect={() => runCommand(() => router.push('/docker/volumes'))}
                            >
                                <Database />
                                <span>Volumes</span>
                                <CommandShortcut>⌘V</CommandShortcut>
                            </CommandItem>
                        </CommandGroup>

                        <CommandSeparator />

                        <CommandGroup heading="Actions rapides">
                            <CommandItem
                                onSelect={() =>
                                    runCommand(() =>
                                        router.push('/docker/containers/create-container'),
                                    )
                                }
                            >
                                <Container />
                                <span>Créer un conteneur</span>
                            </CommandItem>
                            <CommandItem
                                onSelect={() =>
                                    runCommand(() => router.push('/docker/images/pull-image'))
                                }
                            >
                                <FileIcon />
                                <span>Pull une image</span>
                            </CommandItem>
                            <CommandItem
                                onSelect={() => runCommand(() => console.log('Create volume'))}
                            >
                                <Database />
                                <span>Créer un volume</span>
                            </CommandItem>
                        </CommandGroup>

                        <CommandSeparator />

                        <CommandGroup heading="Conteneurs">
                            <CommandItem
                                onSelect={() => runCommand(() => console.log('Start all'))}
                            >
                                <Play />
                                <span>Démarrer tous les conteneurs</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => console.log('Stop all'))}>
                                <Square />
                                <span>Arrêter tous les conteneurs</span>
                            </CommandItem>
                            <CommandItem
                                onSelect={() => runCommand(() => console.log('Remove stopped'))}
                            >
                                <Trash2 />
                                <span>Supprimer les conteneurs arrêtés</span>
                            </CommandItem>
                        </CommandGroup>

                        <CommandSeparator />

                        <CommandGroup heading="Stacks">
                            <CommandItem
                                onSelect={() => runCommand(() => console.log('View stacks'))}
                            >
                                <Layers />
                                <span>Voir les stacks</span>
                            </CommandItem>
                        </CommandGroup>

                        <CommandSeparator />

                        <CommandGroup heading="Système">
                            <CommandItem onSelect={() => runCommand(() => console.log('Settings'))}>
                                <Settings />
                                <span>Paramètres</span>
                                <CommandShortcut>⌘,</CommandShortcut>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => console.log('Terminal'))}>
                                <Terminal />
                                <span>Ouvrir le terminal</span>
                                <CommandShortcut>⌘T</CommandShortcut>
                            </CommandItem>
                        </CommandGroup>
                    </ScrollArea>
                </CommandList>
            </CommandDialog>
        </>
    );
}
