'use client';

import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { HardDrive, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';

export function ServiceMounts() {
    const t = useTranslations('swarm.createService');
    const form = useFormContext();
    const { fields, append, remove } = useFieldArray({ control: form.control, name: 'mounts' });

    return (
        <Card>
            <CardHeaderWithIcon
                icon={HardDrive}
                title={t('mounts')}
                description={t('mountsDescription')}
                className={'justify-between'}
            >
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                        append({ source: '', target: '', type: 'bind', readOnly: false })
                    }
                >
                    <Plus />
                    {t('addMount')}
                </Button>
            </CardHeaderWithIcon>
            <CardContent>
                {fields.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                        {t('noMountsConfigured')}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-3">
                                <FormField
                                    control={form.control}
                                    name={`mounts.${index}.type`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger className="w-28">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>
                                                                {t('mountType')}
                                                            </SelectLabel>
                                                            <SelectItem value="bind">
                                                                {t('mountTypeBind')}
                                                            </SelectItem>
                                                            <SelectItem value="volume">
                                                                {t('mountTypeVolume')}
                                                            </SelectItem>
                                                            <SelectItem value="tmpfs">
                                                                {t('mountTypeTmpfs')}
                                                            </SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`mounts.${index}.source`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    placeholder={t('mountSource')}
                                                    className="font-mono"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <span className="text-muted-foreground pt-1.5">→</span>
                                <FormField
                                    control={form.control}
                                    name={`mounts.${index}.target`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    placeholder={t('mountTarget')}
                                                    className="font-mono"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`mounts.${index}.readOnly`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="flex gap-2 self-start pt-2">
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                    <Label className="text-xs">
                                                        {t('mountReadOnly')}
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
