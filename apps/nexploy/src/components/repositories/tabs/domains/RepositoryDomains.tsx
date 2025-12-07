'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
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
import { Form } from '@workspace/ui/components/form';
import { ChevronDown, Globe, Loader2, Lock, Plus, Save, Trash2 } from 'lucide-react';
import { onDomainAction } from '@/actions/repository/domain.action';
import { cn } from '@workspace/ui/lib/utils';
import { Domain } from '@workspace/typescript-interface/traefik/traefik.config';
import { toast } from 'sonner';
import { domainsFormSchema } from '@workspace/schemas-zod/repository/domain.schema';
import Link from 'next/link';
import { DomainFields } from '@/components/repositories/tabs/domains/DomainFields';

interface RepositoryDomainsProps {
    repositoryId: string;
    domainsConfig: Domain[];
}

const defaultNewDomain = {
    host: '',
    path: '/',
    internalPath: '/',
    stripPath: false,
    containerPort: 3000,
    https: false,
};

export function RepositoryDomains({ repositoryId, domainsConfig }: RepositoryDomainsProps) {
    const router = useRouter();
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onDomainAction,
        zodResolver(domainsFormSchema),
        {
            formProps: {
                defaultValues: {
                    repositoryId,
                    domains: domainsConfig,
                    deletedIds: [],
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    toast.success('Domaines mis à jour avec succès');
                    router.refresh();
                    form.reset({
                        repositoryId,
                        domains: data,
                        deletedIds: [],
                    });
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';
    const domains = form.watch('domains');

    const handleAddNew = () => {
        const currentDomains = form.getValues('domains');
        form.setValue('domains', [...currentDomains, { ...defaultNewDomain }]);
    };

    const handleRemove = (index: number) => {
        const currentDomains = form.getValues('domains');
        const domain = currentDomains[index];

        if (domain?.id) {
            const deleted = new Set(form.getValues('deletedIds') ?? []);
            deleted.add(domain.id);
            form.setValue('deletedIds', Array.from(deleted), { shouldDirty: true });
        }

        form.setValue(
            'domains',
            currentDomains.filter((_, i) => i !== index),
            { shouldDirty: true },
        );
    };

    const handleUndoDelete = (id?: string) => {
        if (!id) return;

        const deleted = new Set(form.getValues('deletedIds') ?? []);
        deleted.delete(id);
        form.setValue('deletedIds', Array.from(deleted), { shouldDirty: true });

        const originalDomain = domainsConfig.find((d) => d.id === id);
        if (originalDomain) {
            const currentDomains = form.getValues('domains');
            form.setValue('domains', [...currentDomains, originalDomain], { shouldDirty: true });
        }
    };

    const toggleExpanded = (index: number) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            const id = `domain-${index}`;
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const deletedIdsSet = new Set(form.watch('deletedIds'));

    const hasChanges = form.formState.isDirty || deletedIdsSet.size > 0;
    const activeDomains = domains.filter((d) => !d.id || !deletedIdsSet.has(d.id));
    const deletedDomains = domainsConfig.filter((d) => d.id && deletedIdsSet.has(d.id));

    return (
        <Card className="mx-5">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Domaines</CardTitle>
                        <CardDescription>
                            Configurez les domaines et le routage pour votre application
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {hasChanges && (
                            <Button
                                size="sm"
                                onClick={handleSubmitWithAction}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
                                Enregistrer
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={handleAddNew}>
                            <Plus />
                            Ajouter
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction}>
                        <div className="space-y-3">
                            {activeDomains.length === 0 ? (
                                <div className="text-muted-foreground py-8 text-center">
                                    Aucun domaine configuré. Ajoutez un domaine pour exposer votre
                                    application.
                                </div>
                            ) : (
                                activeDomains.map((domain) => {
                                    const actualIndex = domains.findIndex((d) => d === domain);
                                    const isNew = !domain.id;
                                    const isExpanded = expandedIds.has(`domain-${actualIndex}`);

                                    return (
                                        <Collapsible
                                            key={actualIndex}
                                            open={isExpanded || isNew}
                                            onOpenChange={() =>
                                                !isNew && toggleExpanded(actualIndex)
                                            }
                                        >
                                            <div
                                                className={cn(
                                                    'rounded-lg border',
                                                    isNew && 'border-dashed',
                                                )}
                                            >
                                                {!isNew && (
                                                    <CollapsibleTrigger asChild>
                                                        <div className="hover:bg-muted/50 flex cursor-pointer items-center justify-between p-3">
                                                            <code className="flex items-center gap-2">
                                                                {domain.https ? (
                                                                    <Lock className="size-4 text-green-500" />
                                                                ) : (
                                                                    <Globe className="text-muted-foreground size-4" />
                                                                )}
                                                                <Link
                                                                    onClick={(e) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                    href={`${domain.https ? 'https://' : 'http://'}${domain.host}${
                                                                        domain.path !== '/'
                                                                            ? domain.path
                                                                            : ''
                                                                    }`}
                                                                    className="text-sm font-medium hover:underline"
                                                                >
                                                                    {domain.https
                                                                        ? 'https://'
                                                                        : 'http://'}
                                                                    {domain.host}
                                                                    {domain.path !== '/' &&
                                                                        domain.path}
                                                                </Link>
                                                                <span className="text-muted-foreground text-sm">
                                                                    → :{domain.containerPort}
                                                                    {domain.internalPath}
                                                                </span>
                                                            </code>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRemove(actualIndex);
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
                                                )}

                                                {isNew && (
                                                    <div className="flex items-center justify-between p-3">
                                                        <span className="text-muted-foreground text-sm font-medium">
                                                            Nouveau domaine
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                handleRemove(actualIndex)
                                                            }
                                                        >
                                                            <Trash2 className="text-destructive size-4" />
                                                        </Button>
                                                    </div>
                                                )}

                                                <CollapsibleContent>
                                                    <div className="border-t border-dashed p-4">
                                                        <DomainFields
                                                            form={form}
                                                            index={actualIndex}
                                                        />
                                                    </div>
                                                </CollapsibleContent>
                                            </div>
                                        </Collapsible>
                                    );
                                })
                            )}

                            {deletedDomains.length > 0 && (
                                <div className="border-t pt-4">
                                    <p className="text-muted-foreground mb-2 text-sm">
                                        Suppression en attente (enregistrez pour confirmer) :
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
                                                Annuler
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
