'use client';

import { useState } from 'react';
import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Eye, EyeOff, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { onEnvVariableAction } from '@/actions/repository/envVariable.action';
import { useRouter } from 'next/navigation';

interface EnvVariable {
    id: string;
    key: string;
    value: string;
}

interface RepositoryEnvTabProps {
    repositoryId: string;
    envVariables: EnvVariable[];
}

export function RepositoryEnv({
    repositoryId,
    envVariables: initialEnvVariables,
}: RepositoryEnvTabProps) {
    const router = useRouter();
    const [envVariables, setEnvVariables] = useState<EnvVariable[]>(initialEnvVariables);
    const [newEnvs, setNewEnvs] = useState<{ key: string; value: string }[]>([]);
    const [deletedIds, setDeletedIds] = useState<string[]>([]);
    const [showValues, setShowValues] = useState<Record<string, boolean>>({});

    const { execute, isPending } = useAction(onEnvVariableAction, {
        onSuccess: () => {
            router.refresh();
            setNewEnvs([]);
            setDeletedIds([]);
        },
    });

    const handleAddNew = () => {
        setNewEnvs([...newEnvs, { key: '', value: '' }]);
    };

    const handleRemoveNew = (index: number) => {
        setNewEnvs(newEnvs.filter((_, i) => i !== index));
    };

    const handleUpdateNew = (index: number, field: 'key' | 'value', value: string) => {
        const updated = [...newEnvs];
        if (updated[index]) {
            updated[index][field] = value;
        }
        setNewEnvs(updated);
    };

    const handleUpdateExisting = (id: string, field: 'key' | 'value', value: string) => {
        setEnvVariables(
            envVariables.map((env) => (env.id === id ? { ...env, [field]: value } : env)),
        );
    };

    const handleDeleteExisting = (id: string) => {
        setDeletedIds([...deletedIds, id]);
    };

    const handleUndoDelete = (id: string) => {
        setDeletedIds(deletedIds.filter((did) => did !== id));
    };

    const toggleShowValue = (id: string) => {
        setShowValues((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const hasChanges = () => {
        if (newEnvs.length > 0) return true;
        if (deletedIds.length > 0) return true;

        const originalMap = new Map(initialEnvVariables.map((env) => [env.id, env]));
        for (const env of envVariables) {
            const original = originalMap.get(env.id);
            if (!original || original.key !== env.key || original.value !== env.value) {
                return true;
            }
        }
        return false;
    };

    const handleSave = () => {
        const updates = envVariables
            .filter((env) => !deletedIds.includes(env.id))
            .map((env) => ({
                id: env.id,
                key: env.key,
                value: env.value,
            }));

        const creates = newEnvs.filter((env) => env.key.trim() !== '');

        execute({
            repositoryId,
            updates,
            creates,
            deleteIds: deletedIds,
        });
    };

    const activeEnvs = envVariables.filter((env) => !deletedIds.includes(env.id));
    const deletedEnvs = envVariables.filter((env) => deletedIds.includes(env.id));

    return (
        <Card className={'mx-5'}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Environment Variables</CardTitle>
                        <CardDescription>Configure environment variables</CardDescription>
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
                            Add Variable
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {activeEnvs.length === 0 && newEnvs.length === 0 ? (
                        <div className="text-muted-foreground py-8 text-center">
                            No environment variables configured.
                        </div>
                    ) : (
                        <>
                            {activeEnvs.map((env) => (
                                <div key={env.id} className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <Input
                                            id={`key-${env.id}`}
                                            value={env.key}
                                            onChange={(e) =>
                                                handleUpdateExisting(env.id, 'key', e.target.value)
                                            }
                                            placeholder="VARIABLE_NAME"
                                            className="font-mono"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Input
                                                id={`value-${env.id}`}
                                                type={showValues[env.id] ? 'text' : 'password'}
                                                value={
                                                    showValues[env.id] ? env.value : '************'
                                                }
                                                onChange={(e) =>
                                                    handleUpdateExisting(
                                                        env.id,
                                                        'value',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="value"
                                                className="pr-10 font-mono"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute top-1/2 right-1 -translate-y-1/2"
                                                onClick={() => toggleShowValue(env.id)}
                                            >
                                                {showValues[env.id] ? <Eye /> : <EyeOff />}
                                            </Button>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteExisting(env.id)}
                                    >
                                        <Trash2 className="text-destructive size-4" />
                                    </Button>
                                </div>
                            ))}

                            {newEnvs.map((env, index) => (
                                <div key={`new-${index}`} className="flex items-end gap-4">
                                    <div className="flex-1">
                                        <Input
                                            id={`new-key-${index}`}
                                            value={env.key}
                                            onChange={(e) =>
                                                handleUpdateNew(index, 'key', e.target.value)
                                            }
                                            placeholder="VARIABLE_NAME"
                                            className="font-mono"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            id={`new-value-${index}`}
                                            value={env.value}
                                            onChange={(e) =>
                                                handleUpdateNew(index, 'value', e.target.value)
                                            }
                                            placeholder="value"
                                            className="font-mono"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveNew(index)}
                                    >
                                        <Trash2 className="text-destructive size-4" />
                                    </Button>
                                </div>
                            ))}
                        </>
                    )}

                    {deletedEnvs.length > 0 && (
                        <div className="border-t pt-4">
                            <p className="text-muted-foreground mb-2 text-sm">
                                Pending deletion (save to confirm):
                            </p>
                            {deletedEnvs.map((env) => (
                                <div
                                    key={env.id}
                                    className="bg-destructive/10 flex items-center justify-between rounded-md p-2"
                                >
                                    <span className="font-mono text-sm line-through">
                                        {env.key}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleUndoDelete(env.id)}
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
