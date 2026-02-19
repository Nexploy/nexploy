'use client';

import { BackupsTable } from '@/components/admin/backups/BackupsTable';

export interface Backup {
    id: string;
    name: string;
    volumeName: string;
    size: number;
    storage: 'local' | 's3';
    status: 'in_progress' | 'completed' | 'failed';
    createdAt: Date;
    s3Bucket?: string;
    s3Region?: string;
}

const mockBackups: Backup[] = [];

export function BackupsSection() {
    return (
        <div className="flex flex-col gap-5">
            <BackupsTable backups={mockBackups} />
        </div>
    );
}
