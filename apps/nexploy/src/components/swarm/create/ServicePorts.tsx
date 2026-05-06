'use client';

import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';

export function ServicePorts() {
    const t = useTranslations('swarm.createService');
    const form = useFormContext();
    const { fields, append, remove } = useFieldArray({ control: form.control, name: 'ports' });

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between">
                    <div className={'flex flex-col gap-2'}>
                        <CardTitle>{t('ports')}</CardTitle>
                        <CardDescription>{t('portsDescription')}</CardDescription>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                            append({
                                published: 80,
                                target: 80,
                                protocol: 'tcp',
                                publishMode: 'ingress',
                            })
                        }
                    >
                        <Plus />
                        {t('addPort')}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {fields.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                        {t('noPortsConfigured')}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-3">
                                <FormField
                                    control={form.control}
                                    name={`ports.${index}.published`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder={t('publishedPort')}
                                                    className="font-mono"
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            parseInt(e.target.value, 10) || 0,
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <span className="text-muted-foreground mt-2">→</span>
                                <FormField
                                    control={form.control}
                                    name={`ports.${index}.target`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder={t('targetPort')}
                                                    className="font-mono"
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            parseInt(e.target.value, 10) || 0,
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`ports.${index}.protocol`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger className="w-20">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>
                                                                {t('protocol')}
                                                            </SelectLabel>
                                                            <SelectItem value="tcp">TCP</SelectItem>
                                                            <SelectItem value="udp">UDP</SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`ports.${index}.publishMode`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger className="w-36">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>
                                                                {t('publishMode')}
                                                            </SelectLabel>
                                                            <SelectItem value="ingress">
                                                                {t('publishModeIngress')}
                                                            </SelectItem>
                                                            <SelectItem value="host">
                                                                {t('publishModeHost')}
                                                            </SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="destructiveGhost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
