'use client';

import { useCallback } from 'react';
import { Textarea } from '@workspace/ui/components/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Upload } from 'lucide-react';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { useTranslations } from 'next-intl';
import { DragAndDrop } from '@workspace/ui/components/drag-and-drop';
import type { UseFormReturn } from 'react-hook-form';

const TLS_EXTENSIONS = ['.pem', '.crt', '.key', '.cert', '.ca-bundle'];

interface TlsCertificateFieldProps {
    form: UseFormReturn<any>;
    name: 'tlsCert' | 'tlsKey' | 'tlsCa';
    label: string;
    placeholder: string;
    disabled?: boolean;
}

export function TlsCertificateField({
    form,
    name,
    label,
    placeholder,
    disabled,
}: TlsCertificateFieldProps) {
    const t = useTranslations('docker.environmentForm');

    const handleFileContent = useCallback(
        (content: string) => {
            form.setValue(name, content || undefined, { shouldValidate: true });
        },
        [form, name],
    );

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Tabs defaultValue="file" className="w-full">
                            <TabsList className="mb-2 w-full">
                                <TabsTrigger value="file">
                                    <Upload className="h-3.5 w-3.5" />
                                    {t('modeFile')}
                                </TabsTrigger>
                                <TabsTrigger value="paste">{t('modePaste')}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="file">
                                <DragAndDrop
                                    onFileContent={handleFileContent}
                                    accept={TLS_EXTENSIONS}
                                    dropText={t('dropZoneText')}
                                    formatsText={t('dropZoneFormats')}
                                    disabled={disabled}
                                />
                            </TabsContent>

                            <TabsContent value="paste">
                                <Textarea
                                    placeholder={placeholder}
                                    {...field}
                                    disabled={disabled}
                                    rows={4}
                                    className="font-mono text-xs"
                                />
                            </TabsContent>
                        </Tabs>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
