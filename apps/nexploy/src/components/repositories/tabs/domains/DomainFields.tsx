import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Switch } from '@workspace/ui/components/switch';

interface DomainFieldsProps {
    form: any;
    index: number;
}

export function DomainFields({ form, index }: DomainFieldsProps) {
    return (
        <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name={`domains.${index}.host`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Host</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="api.example.com"
                                    className="font-mono"
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name={`domains.${index}.path`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Path</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="/" className="font-mono" />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name={`domains.${index}.internalPath`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Chemin interne</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="/" className="font-mono" />
                            </FormControl>
                            <FormDescription>
                                Le chemin où votre application attend les requêtes en interne
                            </FormDescription>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name={`domains.${index}.containerPort`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Port du conteneur</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="number"
                                    onChange={(e) =>
                                        field.onChange(parseInt(e.target.value) || 3000)
                                    }
                                    placeholder="3000"
                                    className="font-mono"
                                />
                            </FormControl>
                            <FormDescription>
                                Le port où votre application s'exécute dans le conteneur
                            </FormDescription>
                        </FormItem>
                    )}
                />
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
                <FormField
                    control={form.control}
                    name={`domains.${index}.stripPath`}
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-3">
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div>
                                <FormLabel className="cursor-pointer">Strip Path</FormLabel>
                                <FormDescription>
                                    Retirer le chemin externe de la requête avant de la transférer
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name={`domains.${index}.https`}
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-3">
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div>
                                <FormLabel className="cursor-pointer">HTTPS</FormLabel>
                                <FormDescription>
                                    Provisionner automatiquement un certificat SSL
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}
