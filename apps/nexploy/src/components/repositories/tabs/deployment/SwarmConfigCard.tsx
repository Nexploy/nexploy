'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Settings2, RefreshCw, RotateCcw, Plus, X } from 'lucide-react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { DeploymentSettingsForm } from '@workspace/schemas-zod/repository/settings/deploymentSettings.schema';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Separator } from '@workspace/ui/components/separator';
import { Button } from '@workspace/ui/components/button';
import { useState } from 'react';
import { Badge } from '@workspace/ui/components/badge';

interface SwarmConfigCardProps {
    form: UseFormReturn<DeploymentSettingsForm>;
}

export function SwarmConfigCard({ form }: SwarmConfigCardProps) {
    const [newConstraint, setNewConstraint] = useState('');
    const constraints = form.watch('placementConstraints');

    const addConstraint = () => {
        if (newConstraint.trim()) {
            form.setValue('placementConstraints', [...constraints, newConstraint.trim()]);
            setNewConstraint('');
        }
    };

    const removeConstraint = (index: number) => {
        form.setValue(
            'placementConstraints',
            constraints.filter((_, i) => i !== index),
        );
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex gap-2">
                    <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <Settings2 className="text-primary size-5" />
                    </div>
                    <div className="flex flex-col">
                        <CardTitle>Configuration Swarm</CardTitle>
                        <CardDescription>
                            Paramètres de réplication, mise à jour et redémarrage
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Replicas */}
                <FormField
                    control={form.control}
                    name="replicas"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre de réplicas</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min={1}
                                    max={100}
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                            </FormControl>
                            <FormDescription>
                                Nombre d'instances de votre application à exécuter
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Separator />

                {/* Update Config */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <RefreshCw className="size-4" />
                        <h4 className="font-medium">Configuration des mises à jour</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="updateParallelism"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Parallélisme</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={100}
                                            {...field}
                                            onChange={(e) =>
                                                field.onChange(parseInt(e.target.value) || 1)
                                            }
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Nombre de tâches mises à jour simultanément
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="updateDelay"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Délai</FormLabel>
                                    <FormControl>
                                        <Input placeholder="10s" {...field} />
                                    </FormControl>
                                    <FormDescription>Délai entre chaque mise à jour</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="updateFailureAction"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Action en cas d'échec</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="PAUSE">Pause</SelectItem>
                                            <SelectItem value="CONTINUE">Continuer</SelectItem>
                                            <SelectItem value="ROLLBACK">Rollback</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="updateOrder"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ordre de mise à jour</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="STOP_FIRST">
                                                Arrêter d'abord
                                            </SelectItem>
                                            <SelectItem value="START_FIRST">
                                                Démarrer d'abord
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                {/* Rollback Config */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <RotateCcw className="size-4" />
                        <h4 className="font-medium">Configuration du rollback</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="rollbackParallelism"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Parallélisme</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={100}
                                            {...field}
                                            onChange={(e) =>
                                                field.onChange(parseInt(e.target.value) || 1)
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="rollbackDelay"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Délai</FormLabel>
                                    <FormControl>
                                        <Input placeholder="10s" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="rollbackFailureAction"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Action en cas d'échec</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="PAUSE">Pause</SelectItem>
                                            <SelectItem value="CONTINUE">Continuer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                {/* Restart Policy */}
                <div className="space-y-4">
                    <h4 className="font-medium">Politique de redémarrage</h4>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="restartCondition"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Condition</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="NONE">Jamais</SelectItem>
                                            <SelectItem value="ON_FAILURE">En cas d'échec</SelectItem>
                                            <SelectItem value="ANY">Toujours</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="restartDelay"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Délai</FormLabel>
                                    <FormControl>
                                        <Input placeholder="5s" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="restartMaxAttempts"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tentatives max</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            {...field}
                                            onChange={(e) =>
                                                field.onChange(parseInt(e.target.value) || 0)
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="restartWindow"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fenêtre de temps</FormLabel>
                                    <FormControl>
                                        <Input placeholder="120s" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                {/* Placement Constraints */}
                <div className="space-y-4">
                    <h4 className="font-medium">Contraintes de placement</h4>
                    <FormDescription>
                        Contraintes pour le placement des tâches (ex: node.role==manager)
                    </FormDescription>

                    <div className="flex gap-2">
                        <Input
                            placeholder="node.role==worker"
                            value={newConstraint}
                            onChange={(e) => setNewConstraint(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addConstraint();
                                }
                            }}
                        />
                        <Button type="button" variant="outline" size="icon" onClick={addConstraint}>
                            <Plus className="size-4" />
                        </Button>
                    </div>

                    {constraints.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {constraints.map((constraint, index) => (
                                <Badge key={index} variant="secondary" className="gap-1 pr-1">
                                    {constraint}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-4 p-0 hover:bg-transparent"
                                        onClick={() => removeConstraint(index)}
                                    >
                                        <X className="size-3" />
                                    </Button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
