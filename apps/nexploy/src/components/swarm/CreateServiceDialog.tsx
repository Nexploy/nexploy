'use client';

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
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PortConfig {
    targetPort: number;
    publishedPort: number;
    protocol: 'tcp' | 'udp';
}

const DOCKER_API_URL = 'http://localhost:3300';

interface CreateServiceDialogProps {
    dockerApiUrl?: string;
}

export function CreateServiceDialog({ dockerApiUrl = DOCKER_API_URL }: CreateServiceDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [replicas, setReplicas] = useState(1);
    const [ports, setPorts] = useState<PortConfig[]>([]);
    const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([]);

    const addPort = () => {
        setPorts([...ports, { targetPort: 80, publishedPort: 8080, protocol: 'tcp' }]);
    };

    const removePort = (index: number) => {
        setPorts(ports.filter((_, i) => i !== index));
    };

    const updatePort = (index: number, field: keyof PortConfig, value: any) => {
        const newPorts = [...ports];
        newPorts[index] = { ...newPorts[index], [field]: value };
        setPorts(newPorts);
    };

    const addEnvVar = () => {
        setEnvVars([...envVars, { key: '', value: '' }]);
    };

    const removeEnvVar = (index: number) => {
        setEnvVars(envVars.filter((_, i) => i !== index));
    };

    const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
        const newEnvVars = [...envVars];
        newEnvVars[index] = { ...newEnvVars[index], [field]: value };
        setEnvVars(newEnvVars);
    };

    const handleCreate = async () => {
        if (!name || !image) {
            toast.error('Name and image are required');
            return;
        }

        setIsLoading(true);
        try {
            const env = envVars
                .filter((e) => e.key)
                .map((e) => `${e.key}=${e.value}`);

            const res = await fetch(`${dockerApiUrl}/api/swarm/services/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    image,
                    replicas,
                    ports,
                    env,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create service');
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
        setReplicas(1);
        setPorts([]);
        setEnvVars([]);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 size-4" />
                    Create Service
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create Swarm Service</DialogTitle>
                    <DialogDescription>
                        Deploy a new service to the swarm cluster
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

                    <div className="grid grid-cols-4 gap-4">
                        <Label className="text-right pt-2">Ports</Label>
                        <div className="col-span-3 space-y-2">
                            {ports.map((port, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Published"
                                        value={port.publishedPort}
                                        onChange={(e) =>
                                            updatePort(index, 'publishedPort', parseInt(e.target.value) || 0)
                                        }
                                        className="w-24"
                                    />
                                    <span>:</span>
                                    <Input
                                        type="number"
                                        placeholder="Target"
                                        value={port.targetPort}
                                        onChange={(e) =>
                                            updatePort(index, 'targetPort', parseInt(e.target.value) || 0)
                                        }
                                        className="w-24"
                                    />
                                    <select
                                        value={port.protocol}
                                        onChange={(e) => updatePort(index, 'protocol', e.target.value)}
                                        className="border-input bg-background h-9 rounded-md border px-3"
                                    >
                                        <option value="tcp">TCP</option>
                                        <option value="udp">UDP</option>
                                    </select>
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
                        <Label className="text-right pt-2">Environment</Label>
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
                                        onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
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
