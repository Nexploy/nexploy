'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import {
    FormControl,
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
import { Input } from '@workspace/ui/components/input';
import { useFormContext } from 'react-hook-form';

export function BuildConfigurationStep() {
    const { control, watch } = useFormContext();
    const buildType = watch('buildType');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configuration de Build</CardTitle>
                <CardDescription>
                    Comment votre application doit être construite
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={control}
                    name="buildType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Type de build</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="DOCKERFILE">Dockerfile</SelectItem>
                                    <SelectItem value="NIXPACKS">Nixpacks</SelectItem>
                                    <SelectItem value="BUILDPACKS">Buildpacks</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {buildType === 'DOCKERFILE' && (
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={control}
                            name="dockerfilePath"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Chemin du Dockerfile</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Dockerfile" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="contextPath"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contexte de build</FormLabel>
                                    <FormControl>
                                        <Input placeholder="." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
