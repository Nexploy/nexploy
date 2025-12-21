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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Switch } from '@workspace/ui/components/switch';
import { useFormContext } from 'react-hook-form';
import { Rocket } from 'lucide-react';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';

export function DeploymentStep() {
    const { control } = useFormContext();
    const { environments } = useEnvironmentStore();

    return (
        <Card>
            <CardHeader>
                <div className={'flex gap-2'}>
                    <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <Rocket className="text-primary size-5" />
                    </div>
                    <div className={'flex flex-col'}>
                        <CardTitle>Déploiement</CardTitle>
                        <CardDescription>Paramètres de déploiement</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={control}
                    name="environmentId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Environnement</FormLabel>
                            <Select {...field} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={
                                                'Sélectionner un environnement (optionnel)'
                                            }
                                        />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {environments.map((env) => (
                                        <SelectItem key={env.id} value={env.id}>
                                            {env.name} ({env.host ?? env.socketPath})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Choisissez l'environnement Docker où ce repository sera déployé
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="autoDeploy"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-base">Déploiement automatique</span>
                                    <FormDescription className="m-0">
                                        Déployer automatiquement lors d'un push sur la branche
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormLabel>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
