'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { onVolumeCreate } from '@/actions/docker/volume/volumeCreate.action';
import { useSheetStore } from '@/stores/useSheetStore';
import { Loader2 } from 'lucide-react';

export function AddVolumeSheet() {
    const [volumeName, setVolumeName] = useState('');
    const [driver, setDriver] = useState('local');
    const [isLoading, setIsLoading] = useState(false);
    const closeSheet = useSheetStore((state) => state.closeSheet);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!volumeName.trim()) {
            return;
        }

        setIsLoading(true);

        try {
            await onVolumeCreate({
                name: volumeName,
                driver: driver || 'local',
            });

            setVolumeName('');
            setDriver('local');
            closeSheet();
        } catch (error) {
            console.error('Error creating volume:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
                <Label htmlFor="volumeName">Nom du volume</Label>
                <Input
                    id="volumeName"
                    placeholder="mon-volume"
                    value={volumeName}
                    onChange={(e) => setVolumeName(e.target.value)}
                    required
                    disabled={isLoading}
                />
                <p className="text-muted-foreground text-xs">Le nom du volume doit être unique</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="driver">Driver</Label>
                <Input
                    id="driver"
                    placeholder="local"
                    value={driver}
                    onChange={(e) => setDriver(e.target.value)}
                    disabled={isLoading}
                />
                <p className="text-muted-foreground text-xs">Par défaut: local</p>
            </div>

            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeSheet} disabled={isLoading}>
                    Annuler
                </Button>
                <Button type="submit" disabled={isLoading || !volumeName.trim()}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Créer le volume
                </Button>
            </div>
        </form>
    );
}
