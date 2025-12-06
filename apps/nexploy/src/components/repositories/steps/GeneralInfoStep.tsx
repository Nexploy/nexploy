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
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { Optional } from '@workspace/ui/components/utils/Optional';
import { useFormContext } from 'react-hook-form';

export function GeneralInfoStep() {
    const { control } = useFormContext();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>Détails de base de votre projet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nom du projet</FormLabel>
                            <FormControl>
                                <Input placeholder="mon-super-projet" {...field} />
                            </FormControl>
                            <FormDescription>
                                Un nom unique pour identifier votre projet
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Description <Optional />
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Une courte description de votre projet..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
