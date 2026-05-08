'use client';

import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { HardDrive, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';
import { FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import { Switch } from '@workspace/ui/components/switch';

export function ContainerVolumes() {
    const t = useTranslations('docker.createContainer');
    const form = useFormContext();
    const { fields, append, remove } = useFieldArray({ control: form.control, name: 'volumes' });

    return (
        <Card>
            <CardHeaderWithIcon
                icon={HardDrive}
                title={t('volumes')}
                description={t('volumesDescription')}
            >
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={() => append({ hostPath: '', containerPath: '', readOnly: false })}
                >
                    <Plus />
                    {t('addVolume')}
                </Button>
            </CardHeaderWithIcon>
            <CardContent>
                {fields.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                        {t('noVolumesConfigured')}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-3">
                                <FormField
                                    control={form.control}
                                    name={`volumes.${index}.hostPath`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input placeholder={t('hostPath')} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <span className="text-muted-foreground">→</span>
                                <FormField
                                    control={form.control}
                                    name={`volumes.${index}.containerPath`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    placeholder={t('containerPath')}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`volumes.${index}.readOnly`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                    <Label className="text-xs">
                                                        {t('readOnly')}
                                                    </Label>
                                                </div>
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
