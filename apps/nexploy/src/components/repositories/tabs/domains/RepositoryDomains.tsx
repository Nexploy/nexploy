'use client';

import { useState } from 'react';
import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Switch } from '@workspace/ui/components/switch';
import { Label } from '@workspace/ui/components/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';
import { ChevronDown, Globe, Loader2, Lock, Plus, Save, Trash2 } from 'lucide-react';
import { onDomainAction } from '@/actions/repository/domain.action';
import { useRouter } from 'next/navigation';
import { cn } from '@workspace/ui/lib/utils';

interface Domain {
    id: string;
    host: string;
    path: string;
    internalPath: string;
    stripPath: boolean;
    containerPort: number;
    https: boolean;
}

interface NewDomain {
    host: string;
    path: string;
    internalPath: string;
    stripPath: boolean;
    containerPort: number;
    https: boolean;
}

interface RepositoryDomainsProps {
    repositoryId: string;
    domains: Domain[];
}

const defaultNewDomain: NewDomain = {
    host: '',
    path: '/',
    internalPath: '/',
    stripPath: false,
    containerPort: 3000,
    https: false,
};

export function RepositoryDomains({
    repositoryId,
    domains: initialDomains,
}: RepositoryDomainsProps) {
    const router = useRouter();
    const [domains, setDomains] = useState<Domain[]>(initialDomains);
    const [newDomains, setNewDomains] = useState<NewDomain[]>([]);
    const [deletedIds, setDeletedIds] = useState<string[]>([]);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const { execute, isPending } = useAction(onDomainAction, {
        onSuccess: () => {
            router.refresh();
            setNewDomains([]);
            setDeletedIds([]);
        },
    });

    const handleAddNew = () => {
        setNewDomains([...newDomains, { ...defaultNewDomain }]);
    };

    const handleRemoveNew = (index: number) => {
        setNewDomains(newDomains.filter((_, i) => i !== index));
    };

    const handleUpdateNew = <K extends keyof NewDomain>(
        index: number,
        field: K,
        value: NewDomain[K],
    ) => {
        const updated = [...newDomains];
        if (updated[index]) {
            updated[index][field] = value;
        }
        setNewDomains(updated);
    };

    const handleUpdateExisting = <K extends keyof NewDomain>(
        id: string,
        field: K,
        value: NewDomain[K],
    ) => {
        setDomains(domains.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
    };

    const handleDeleteExisting = (id: string) => {
        setDeletedIds([...deletedIds, id]);
    };

    const handleUndoDelete = (id: string) => {
        setDeletedIds(deletedIds.filter((did) => did !== id));
    };

    const toggleExpanded = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const hasChanges = () => {
        if (newDomains.length > 0) return true;
        if (deletedIds.length > 0) return true;

        const originalMap = new Map(initialDomains.map((d) => [d.id, d]));
        for (const domain of domains) {
            const original = originalMap.get(domain.id);
            if (!original) return true;
            if (
                original.host !== domain.host ||
                original.path !== domain.path ||
                original.internalPath !== domain.internalPath ||
                original.stripPath !== domain.stripPath ||
                original.containerPort !== domain.containerPort ||
                original.https !== domain.https
            ) {
                return true;
            }
        }
        return false;
    };

    const handleSave = () => {
        const updates = domains
            .filter((d) => !deletedIds.includes(d.id))
            .map((d) => ({
                id: d.id,
                host: d.host,
                path: d.path,
                internalPath: d.internalPath,
                stripPath: d.stripPath,
                containerPort: d.containerPort,
                https: d.https,
            }));

        const creates = newDomains.filter((d) => d.host.trim() !== '');

        execute({
            repositoryId,
            updates,
            creates,
            deleteIds: deletedIds,
        });
    };

    const activeDomains = domains.filter((d) => !deletedIds.includes(d.id));
    const deletedDomains = domains.filter((d) => deletedIds.includes(d.id));

    return (
        <Card className="mx-5">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="size-5" />
                            Domains
                        </CardTitle>
                        <CardDescription>
                            Configure domains and routing for your application
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {hasChanges() && (
                            <Button size="sm" onClick={handleSave} disabled={isPending}>
                                {isPending ? <Loader2 className="animate-spin" /> : <Save />}
                                Save Changes
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={handleAddNew}>
                            <Plus />
                            Add Domain
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {activeDomains.length === 0 && newDomains.length === 0 ? (
                        <div className="text-muted-foreground py-8 text-center">
                            No domains configured. Add a domain to expose your application.
                        </div>
                    ) : (
                        <>
                            {activeDomains.map((domain) => (
                                <DomainCard
                                    key={domain.id}
                                    domain={domain}
                                    isExpanded={expandedIds.has(domain.id)}
                                    onToggle={() => toggleExpanded(domain.id)}
                                    onUpdate={(field, value) =>
                                        handleUpdateExisting(domain.id, field, value)
                                    }
                                    onDelete={() => handleDeleteExisting(domain.id)}
                                />
                            ))}

                            {newDomains.map((domain, index) => (
                                <NewDomainCard
                                    key={`new-${index}`}
                                    domain={domain}
                                    onUpdate={(field, value) =>
                                        handleUpdateNew(index, field, value)
                                    }
                                    onDelete={() => handleRemoveNew(index)}
                                />
                            ))}
                        </>
                    )}

                    {deletedDomains.length > 0 && (
                        <div className="border-t pt-4">
                            <p className="text-muted-foreground mb-2 text-sm">
                                Pending deletion (save to confirm):
                            </p>
                            {deletedDomains.map((domain) => (
                                <div
                                    key={domain.id}
                                    className="bg-destructive/10 flex items-center justify-between rounded-md p-3"
                                >
                                    <span className="font-mono text-sm line-through">
                                        {domain.host}
                                        {domain.path}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleUndoDelete(domain.id)}
                                    >
                                        Undo
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

interface DomainCardProps {
    domain: Domain;
    isExpanded: boolean;
    onToggle: () => void;
    onUpdate: <K extends keyof NewDomain>(field: K, value: NewDomain[K]) => void;
    onDelete: () => void;
}

function DomainCard({ domain, isExpanded, onToggle, onUpdate, onDelete }: DomainCardProps) {
    return (
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
            <div className="rounded-lg border">
                <CollapsibleTrigger asChild>
                    <div className="hover:bg-muted/50 flex cursor-pointer items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            {domain.https ? (
                                <Lock className="size-4 text-green-500" />
                            ) : (
                                <Globe className="text-muted-foreground size-4" />
                            )}
                            <span className="font-mono text-sm font-medium">
                                {domain.https ? 'https://' : 'http://'}
                                {domain.host}
                                {domain.path !== '/' && domain.path}
                            </span>
                            <span className="text-muted-foreground text-xs">
                                → :{domain.containerPort}
                                {domain.internalPath}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                            >
                                <Trash2 className="text-destructive size-4" />
                            </Button>
                            <ChevronDown
                                className={cn(
                                    'size-4 transition-transform',
                                    isExpanded && 'rotate-180',
                                )}
                            />
                        </div>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="border-t p-4">
                        <DomainFields
                            host={domain.host}
                            path={domain.path}
                            internalPath={domain.internalPath}
                            stripPath={domain.stripPath}
                            containerPort={domain.containerPort}
                            https={domain.https}
                            onUpdate={onUpdate}
                        />
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}

interface NewDomainCardProps {
    domain: NewDomain;
    onUpdate: <K extends keyof NewDomain>(field: K, value: NewDomain[K]) => void;
    onDelete: () => void;
}

function NewDomainCard({ domain, onUpdate, onDelete }: NewDomainCardProps) {
    return (
        <div className="rounded-lg border border-dashed">
            <div className="flex items-center justify-between border-b p-4">
                <span className="text-muted-foreground text-sm font-medium">New Domain</span>
                <Button variant="ghost" size="icon" onClick={onDelete}>
                    <Trash2 className="text-destructive size-4" />
                </Button>
            </div>
            <div className="p-4">
                <DomainFields
                    host={domain.host}
                    path={domain.path}
                    internalPath={domain.internalPath}
                    stripPath={domain.stripPath}
                    containerPort={domain.containerPort}
                    https={domain.https}
                    onUpdate={onUpdate}
                />
            </div>
        </div>
    );
}

interface DomainFieldsProps {
    host: string;
    path: string;
    internalPath: string;
    stripPath: boolean;
    containerPort: number;
    https: boolean;
    onUpdate: <K extends keyof NewDomain>(field: K, value: NewDomain[K]) => void;
}

function DomainFields({
    host,
    path,
    internalPath,
    stripPath,
    containerPort,
    https,
    onUpdate,
}: DomainFieldsProps) {
    return (
        <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="host">Host</Label>
                    <Input
                        id="host"
                        value={host}
                        onChange={(e) => onUpdate('host', e.target.value)}
                        placeholder="api.example.com"
                        className="font-mono"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="path">Path</Label>
                    <Input
                        id="path"
                        value={path}
                        onChange={(e) => onUpdate('path', e.target.value)}
                        placeholder="/"
                        className="font-mono"
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="internalPath">Internal Path</Label>
                    <Input
                        id="internalPath"
                        value={internalPath}
                        onChange={(e) => onUpdate('internalPath', e.target.value)}
                        placeholder="/"
                        className="font-mono"
                    />
                    <p className="text-muted-foreground text-xs">
                        The path where your application expects to receive requests internally
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="containerPort">Container Port</Label>
                    <Input
                        id="containerPort"
                        type="number"
                        value={containerPort}
                        onChange={(e) =>
                            onUpdate('containerPort', parseInt(e.target.value) || 3000)
                        }
                        placeholder="3000"
                        className="font-mono"
                    />
                    <p className="text-muted-foreground text-xs">
                        The port where your application is running inside the container
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
                <div className="flex items-center gap-3">
                    <Switch
                        id="stripPath"
                        checked={stripPath}
                        onCheckedChange={(checked) => onUpdate('stripPath', checked)}
                    />
                    <div>
                        <Label htmlFor="stripPath" className="cursor-pointer">
                            Strip Path
                        </Label>
                        <p className="text-muted-foreground text-xs">
                            Remove the external path from the request before forwarding
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Switch
                        id="https"
                        checked={https}
                        onCheckedChange={(checked) => onUpdate('https', checked)}
                    />
                    <div>
                        <Label htmlFor="https" className="cursor-pointer">
                            HTTPS
                        </Label>
                        <p className="text-muted-foreground text-xs">
                            Automatically provision SSL Certificate
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
