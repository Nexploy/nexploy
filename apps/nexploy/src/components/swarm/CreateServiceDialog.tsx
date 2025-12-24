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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const DOCKER_API_URL = process.env.NEXT_PUBLIC_DOCKER_API_URL || 'http://localhost:3300';

interface PortConfig {
    targetPort: number;
    publishedPort: number;
    protocol: 'tcp' | 'udp';
    publishMode: 'ingress' | 'host';
}

interface EnvVar {
    key: string;
    value: string;
}

interface CreateServiceDialogProps {
    trigger?: React.ReactNode;
}

export function CreateServiceDialog({ trigger }: CreateServiceDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [mode, setMode] = useState<'replicated' | 'global'>('replicated');
    const [replicas, setReplicas] = useState(1);
    const [ports, setPorts] = useState<PortConfig[]>([]);
    const [envVars, setEnvVars] = useState<EnvVar[]>([]);
    const [constraints, setConstraints] = useState('');

    const addPort = () => {
        setPorts([
            ...ports,
            { targetPort: 80, publishedPort: 8080, protocol: 'tcp', publishMode: 'ingress' },
        ]);
    };

    const removePort = (index: number) => {
        setPorts(ports.filter((_, i) => i !== index));
    };

    const updatePort = (index: number, field: keyof PortConfig, value: any) => {
        setPorts(
            ports.map((port, i) =>
                i === index ? ({ ...port, [field]: value } as PortConfig) : port,
            ),
        );
    };

    const addEnvVar = () => {
        setEnvVars([...envVars, { key: '', value: '' }]);
    };

    const removeEnvVar = (index: number) => {
        setEnvVars(envVars.filter((_, i) => i !== index));
    };

    const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
        setEnvVars(
            envVars.map((env, i) => (i === index ? ({ ...env, [field]: value } as EnvVar) : env)),
        );
    };

    const handleCreate = async () => {
        if (!name || !image) {
            toast.error('Name and image are required');
            return;
        }

        setIsLoading(true);
        try {
            const env = envVars.filter((e) => e.key).map((e) => `${e.key}=${e.value}`);
            const constraintList = constraints
                .split('\n')
                .map((c) => c.trim())
                .filter((c) => c);

            const res = await fetch(`${DOCKER_API_URL}/api/swarm/services`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    image,
                    mode,
                    replicas: mode === 'replicated' ? replicas : undefined,
                    ports,
                    env,
                    constraints: constraintList.length > 0 ? constraintList : undefined,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || error.error || 'Failed to create service');
            }

            toast.success(`Service ${name} created successfully`);
            setOpen(false);
            resetForm();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setImage('');
        setMode('replicated');
        setReplicas(1);
        setPorts([]);
        setEnvVars([]);
        setConstraints('');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 size-4" />
                        Create Service
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Swarm Service</DialogTitle>
                    <DialogDescription>
                        Deploy a new service to the swarm cluster.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="my-service"
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="image" className="text-right">
                            Image
                        </Label>
                        <Input
                            id="image"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            placeholder="nginx:latest"
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="mode" className="text-right">
                            Mode
                        </Label>
                        <Select
                            value={mode}
                            onValueChange={(v) => setMode(v as 'replicated' | 'global')}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="replicated">Replicated</SelectItem>
                                <SelectItem value="global">Global</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {mode === 'replicated' && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="replicas" className="text-right">
                                Replicas
                            </Label>
                            <Input
                                id="replicas"
                                type="number"
                                min={1}
                                value={replicas}
                                onChange={(e) => setReplicas(parseInt(e.target.value) || 1)}
                                className="col-span-3"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-4 gap-4">
                        <Label className="pt-2 text-right">Ports</Label>
                        <div className="col-span-3 space-y-2">
                            {ports.map((port, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Published"
                                        value={port.publishedPort}
                                        onChange={(e) =>
                                            updatePort(
                                                index,
                                                'publishedPort',
                                                parseInt(e.target.value) || 0,
                                            )
                                        }
                                        className="w-24"
                                    />
                                    <span>:</span>
                                    <Input
                                        type="number"
                                        placeholder="Target"
                                        value={port.targetPort}
                                        onChange={(e) =>
                                            updatePort(
                                                index,
                                                'targetPort',
                                                parseInt(e.target.value) || 0,
                                            )
                                        }
                                        className="w-24"
                                    />
                                    <Select
                                        value={port.protocol}
                                        onValueChange={(v) => updatePort(index, 'protocol', v)}
                                    >
                                        <SelectTrigger className="w-20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tcp">TCP</SelectItem>
                                            <SelectItem value="udp">UDP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={port.publishMode}
                                        onValueChange={(v) => updatePort(index, 'publishMode', v)}
                                    >
                                        <SelectTrigger className="w-24">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ingress">Ingress</SelectItem>
                                            <SelectItem value="host">Host</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removePort(index)}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addPort}>
                                <Plus className="mr-2 size-4" />
                                Add Port
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <Label className="pt-2 text-right">Environment</Label>
                        <div className="col-span-3 space-y-2">
                            {envVars.map((env, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        placeholder="KEY"
                                        value={env.key}
                                        onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                                        className="flex-1"
                                    />
                                    <span>=</span>
                                    <Input
                                        placeholder="value"
                                        value={env.value}
                                        onChange={(e) =>
                                            updateEnvVar(index, 'value', e.target.value)
                                        }
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeEnvVar(index)}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addEnvVar}>
                                <Plus className="mr-2 size-4" />
                                Add Variable
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <Label htmlFor="constraints" className="pt-2 text-right">
                            Constraints
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="constraints"
                                value={constraints}
                                onChange={(e) => setConstraints(e.target.value)}
                                placeholder="node.role==worker"
                            />
                            <p className="text-muted-foreground mt-1 text-xs">
                                Placement constraints (e.g., node.role==worker,
                                node.labels.zone==us-east)
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Service'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
