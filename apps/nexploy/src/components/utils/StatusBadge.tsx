import { Badge } from '@workspace/ui/components/badge';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { BuildStatus } from '@workspace/typescript-interface/inngest/build';

export const getStatusBadge = (status?: BuildStatus | string) => {
    switch (status) {
        case 'COMPLETED':
            return (
                <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    Success
                </Badge>
            );
        case 'FAILED':
            return (
                <Badge variant="destructive" className="gap-1">
                    <XCircle className="size-3" />
                    Failed
                </Badge>
            );
        case 'BUILDING':
            return (
                <Badge variant="warning">
                    <Loader2 className="size-3 animate-spin" />
                    Building
                </Badge>
            );
        case 'QUEUED':
            return (
                <Badge variant="secondary" className="gap-1">
                    <Clock className="size-3" />
                    Queued
                </Badge>
            );
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};
