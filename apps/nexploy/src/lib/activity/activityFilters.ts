import type { ActivityLogEntry } from '@workspace/typescript-interface/activity';

export function activityMatchesSearch(entry: ActivityLogEntry, search: string): boolean {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;

    return [entry.name, entry.targetName, entry.targetId, entry.actorName, entry.actorEmail, entry.errorMessage].some(
        (value) => value?.toLowerCase().includes(needle),
    );
}
