'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { onCreateServiceAction } from '@/actions/docker/swarm/serviceAction.action';
import { useTranslations } from 'next-intl';

interface CreateServiceDialogProps {
    trigger?: React.ReactNode;
}

export function CreateServiceDialog({ trigger }: CreateServiceDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [replicas, setReplicas] = useState('1');
    const [ports, setPorts] = useState<{ published: string; target: string }[]>([]);
    const t = useTranslations('swarm');
    const tCommon = useTranslations('common');

    const addPort = () => setPorts((prev) => [...prev, { published: '', target: '' }]);
    const removePort = (index: number) => setPorts((prev) => prev.filter((_, i) => i !== index));
    const updatePort = (
        index: number,
        field: 'published' | 'target',
        value: string,
    ) => {
        setPorts((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
    };

    const resetForm = () => {
        setName('');
        setImage('');
        setReplicas('1');
        setPorts([]);
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error(t('serviceNameRequired'));
            return;
        }
        if (!image.trim()) {
            toast.error(t('imageRequired'));
            return;
        }

        const parsedPorts = ports
            .filter((p) => p.published && p.target)
            .map((p) => ({
                published: parseInt(p.published, 10),
                target: parseInt(p.target, 10),
                protocol: 'tcp' as const,
            }));

        setIsLoading(true);
        try {
            await onCreateServiceAction({
                name: name.trim(),
                image: image.trim(),
                replicas: parseInt(replicas, 10) || 1,
                ports: parsedPorts.length > 0 ? parsedPorts : undefined,
            });
            toast.success(t('serviceCreatedSuccess', { name: name.trim() }));
            setOpen(false);
            resetForm();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm">
                        <Plus className="mr-2 size-4" />
                        {t('createService')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('createService')}</DialogTitle>
                    <DialogDescription>{t('createServiceDescription')}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="serviceName">{t('serviceName')}</Label>
                        <Input
                            id="serviceName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="my-service"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="serviceImage">{t('image')}</Label>
                        <Input
                            id="serviceImage"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            placeholder="nginx:latest"
                            className="font-mono"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="serviceReplicas">{t('replicaCount')}</Label>
                        <Input
                            id="serviceReplicas"
                            type="number"
                            min={1}
                            value={replicas}
                            onChange={(e) => setReplicas(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label>{t('ports')}</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addPort}>
                                <Plus className="size-3" />
                                {t('addPort')}
                            </Button>
                        </div>
                        {ports.map((port, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    placeholder={t('publishedPort')}
                                    value={port.published}
                                    onChange={(e) => updatePort(index, 'published', e.target.value)}
                                    className="font-mono"
                                />
                                <span className="text-muted-foreground">:</span>
                                <Input
                                    type="number"
                                    placeholder={t('targetPort')}
                                    value={port.target}
                                    onChange={(e) => updatePort(index, 'target', e.target.value)}
                                    className="font-mono"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removePort(index)}
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        {tCommon('cancel')}
                    </Button>
                    <Button onClick={handleCreate} disabled={isLoading}>
                        {isLoading ? t('creating') : t('createService')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
