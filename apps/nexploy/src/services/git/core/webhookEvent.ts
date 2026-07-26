import { MergeRequestAction } from '@workspace/typescript-interface/webhook';

export function mapPullRequestAction(
    action: string | undefined,
    merged?: boolean,
): MergeRequestAction | null {
    switch (action) {
        case 'opened':
        case 'reopened':
            return 'opened';
        case 'synchronize':
        case 'synchronized':
        case 'edited':
            return 'updated';
        case 'closed':
            return merged ? 'merged' : 'closed';
        default:
            return null;
    }
}
