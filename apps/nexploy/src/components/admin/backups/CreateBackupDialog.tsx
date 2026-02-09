'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@workspace/ui/components/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useVolumeStore } from '@/stores/docker/useVolumeStore';
import { Cloud, Download, HardDrive, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateBackupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type BackupDestination = 'local' | 's3';

export function CreateBackupDialog({ open, onOpenChange }: CreateBackupDialogProps) {
    const t = useTranslations('admin');
    const tCommon = useTranslations('common');

    const volumes = useVolumeStore((state) => state.volumes);

    const [selectedVolume, setSelectedVolume] = useState<string>('');
    const [destination, setDestination] = useState<BackupDestination>('local');
    const [s3Bucket, setS3Bucket] = useState('');
    const [s3Region, setS3Region] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!selectedVolume) {
            toast.error(t('volumeRequired'));
            return;
        }

        if (destination === 's3' && (!s3Bucket || !s3Region)) {
            toast.error(t('s3ConfigRequired'));
            return;
        }

        setIsLoading(true);

        try {
            // TODO: Implement backup creation action
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success(t('backupCreatedSuccess'));
            onOpenChange(false);
            resetForm();
        } catch {
            toast.error('Failed to create backup');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedVolume('');
        setDestination('local');
        setS3Bucket('');
        setS3Region('');
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetForm();
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('createBackup')}</DialogTitle>
                    <DialogDescription>{t('createBackupDescription')}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="volume">{t('selectVolume')}</Label>
                        <Select value={selectedVolume} onValueChange={setSelectedVolume}>
                            <SelectTrigger id="volume">
                                <SelectValue placeholder={t('selectVolumePlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                {volumes.length === 0 ? (
                                    <div className="text-muted-foreground px-2 py-4 text-center text-sm">
                                        {t('noVolumesAvailable')}
                                    </div>
                                ) : (
                                    volumes.map((volume) => (
                                        <SelectItem key={volume.name} value={volume.name}>
                                            <div className="flex items-center gap-2">
                                                <HardDrive className="size-4" />
                                                {volume.name}
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>{t('backupDestination')}</Label>
                        <RadioGroup
                            value={destination}
                            onValueChange={(value) => setDestination(value as BackupDestination)}
                            className="grid grid-cols-2 gap-4"
                        >
                            <div>
                                <RadioGroupItem value="local" id="local" className="peer sr-only" />
                                <Label
                                    htmlFor="local"
                                    className="border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex cursor-pointer flex-col items-center justify-between rounded-md border-2 p-4"
                                >
                                    <Download className="mb-3 size-6" />
                                    {t('localDownload')}
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="s3" id="s3" className="peer sr-only" />
                                <Label
                                    htmlFor="s3"
                                    className="border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex cursor-pointer flex-col items-center justify-between rounded-md border-2 p-4"
                                >
                                    <Cloud className="mb-3 size-6" />
                                    {t('awsS3')}
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {destination === 's3' && (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="s3Bucket">{t('s3BucketName')}</Label>
                                <Input
                                    id="s3Bucket"
                                    value={s3Bucket}
                                    onChange={(e) => setS3Bucket(e.target.value)}
                                    placeholder={t('s3BucketNamePlaceholder')}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="s3Region">{t('s3Region')}</Label>
                                <Input
                                    id="s3Region"
                                    value={s3Region}
                                    onChange={(e) => setS3Region(e.target.value)}
                                    placeholder={t('s3RegionPlaceholder')}
                                />
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        {tCommon('cancel')}
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !selectedVolume}>
                        {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                        {t('createBackup')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
