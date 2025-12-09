'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { HeartPulse } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
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
import { Switch } from '@workspace/ui/components/switch';

interface HealthCheckConfigCardProps {
    form: UseFormReturn<DeploymentSettingsForm>;
}

export function HealthCheckConfigCard({ form }: HealthCheckConfigCardProps) {
    const healthCheckEnabled = form.watch('healthCheckEnabled');

    return (
        <Card>
            <CardHeader>
                <div className="flex gap-2">
                    <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <HeartPulse className="text-primary size-5" />
                    </div>
                    <div className="flex flex-col">
                        <CardTitle>Health Check</CardTitle>
                        <CardDescription>
                            Configuration des vérifications de santé du container
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="healthCheckEnabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Activer le Health Check</FormLabel>
                                <FormDescription>
                                    Vérifier périodiquement la santé de votre application
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {healthCheckEnabled && (
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="healthCheckCommand"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Commande</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="CMD curl -f http://localhost/ || exit 1"
                                            value={field.value ?? ''}
                                            onChange={(e) =>
                                                field.onChange(e.target.value || null)
                                            }
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Commande exécutée pour vérifier la santé
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="healthCheckInterval"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Intervalle</FormLabel>
                                        <FormControl>
                                            <Input placeholder="30s" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Temps entre chaque vérification
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="healthCheckTimeout"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Timeout</FormLabel>
                                        <FormControl>
                                            <Input placeholder="10s" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Temps max pour une vérification
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="healthCheckRetries"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Essais</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={10}
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(parseInt(e.target.value) || 1)
                                                }
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Échecs avant unhealthy
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="healthCheckStartPeriod"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Période de démarrage</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0s" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Temps d'initialisation avant checks
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
