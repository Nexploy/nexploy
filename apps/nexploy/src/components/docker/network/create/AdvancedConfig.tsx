import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { KeyValueInput, KeyValueList } from '@/components/forms/KeyValue';
import { Button } from '@workspace/ui/components/button';
import { useKeyValueState } from '@/hooks/useKeyValueState';
import { UseFormReturn } from 'react-hook-form';
import { NetworkCreateForm } from '@workspace/schemas-zod/docker/network/networkAction.schema';

interface AdvancedConfigProps {
    form: UseFormReturn<NetworkCreateForm>;
}

export function AdvancedConfig({ form }: AdvancedConfigProps) {
    const optionState = useKeyValueState();
    const labelState = useKeyValueState();

    const handleAddOption = () => {
        if (optionState.key.trim() && optionState.value.trim()) {
            const currentOpts = form.getValues('options') || {};
            form.setValue('options', {
                ...currentOpts,
                [optionState.key.trim()]: optionState.value.trim(),
            });
            optionState.reset();
        }
    };

    const handleRemoveOption = (key: string) => {
        const currentOpts = form.getValues('options') || {};
        const { [key]: _, ...rest } = currentOpts;
        form.setValue('options', rest);
    };

    const handleAddLabel = () => {
        if (labelState.key.trim() && labelState.value.trim()) {
            const currentLabels = form.getValues('labels') || {};
            form.setValue('labels', {
                ...currentLabels,
                [labelState.key.trim()]: labelState.value.trim(),
            });
            labelState.reset();
        }
    };

    const handleRemoveLabel = (key: string) => {
        const currentLabels = form.getValues('labels') || {};
        const { [key]: _, ...rest } = currentLabels;
        form.setValue('labels', rest);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configuration avancée</CardTitle>
                <CardDescription>Options et métadonnées supplémentaires</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="options"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Options du driver</FormLabel>
                            <FormControl>
                                <div className="space-y-3">
                                    <KeyValueInput
                                        keyValue={optionState.key}
                                        value={optionState.value}
                                        onKeyChange={optionState.setKey}
                                        onValueChange={optionState.setValue}
                                        keyPlaceholder="Clé (ex: com.docker.network.bridge.name)"
                                        valuePlaceholder="Valeur (ex: docker0)"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAddOption}
                                        disabled={
                                            !optionState.key.trim() || !optionState.value.trim()
                                        }
                                    >
                                        Ajouter option
                                    </Button>
                                    <KeyValueList
                                        items={field.value}
                                        onRemove={handleRemoveOption}
                                        title="Options ajoutées :"
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                            <FormDescription>
                                Options spécifiques au driver. Exemples :{' '}
                                <code className="bg-muted rounded px-1 py-0.5 text-xs">
                                    com.docker.network.bridge.name=br0
                                </code>
                            </FormDescription>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="labels"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Labels</FormLabel>
                            <FormControl>
                                <div className="space-y-3">
                                    <KeyValueInput
                                        keyValue={labelState.key}
                                        value={labelState.value}
                                        onKeyChange={labelState.setKey}
                                        onValueChange={labelState.setValue}
                                        keyPlaceholder="Clé"
                                        valuePlaceholder="Valeur"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAddLabel}
                                        disabled={
                                            !labelState.key.trim() || !labelState.value.trim()
                                        }
                                    >
                                        Ajouter label
                                    </Button>
                                    <KeyValueList
                                        items={field.value}
                                        onRemove={handleRemoveLabel}
                                        title="Labels ajoutés :"
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                            <FormDescription>
                                Métadonnées pour organiser et identifier le réseau. Exemples :{' '}
                                <code className="bg-muted rounded px-1 py-0.5 text-xs">
                                    env=production
                                </code>
                            </FormDescription>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
