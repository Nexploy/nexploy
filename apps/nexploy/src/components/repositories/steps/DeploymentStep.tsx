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
} from '@workspace/ui/components/form';
import { Switch } from '@workspace/ui/components/switch';
import { useFormContext } from 'react-hook-form';
import { Rocket } from 'lucide-react';

export function DeploymentStep() {
    const { control } = useFormContext();

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
            <CardContent>
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
