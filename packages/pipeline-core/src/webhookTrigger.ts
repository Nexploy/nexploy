import { MERGE_REQUEST_ACTIONS, WEBHOOK_TRIGGER_EVENTS } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { MergeRequestAction, WebhookEventType, WebhookTrigger } from '@workspace/typescript-interface/webhook';

type TriggerEvent = (typeof WEBHOOK_TRIGGER_EVENTS)[number];

const DEFAULT_TRIGGER_EVENTS: TriggerEvent[] = ['push'];
const DEFAULT_MERGE_REQUEST_ACTIONS: MergeRequestAction[] = ['opened', 'updated'];

export interface WebhookCloneFilters {
    triggerEvents?: WebhookEventType[];
    branchFilter?: string;
    mergeRequestActions?: MergeRequestAction[];
    tagFilter?: string;
}

export type WebhookSkipReason = 'event-filter' | 'merge-request-action' | 'tag-filter' | 'branch-filter';

export interface WebhookTriggerMatch {
    matched: boolean;
    reason?: WebhookSkipReason;
    detail?: string;
}

export function matchesRefFilter(ref: string, filter: string): boolean {
    const patterns = filter
        .split(',')
        .map((pattern) => pattern.trim())
        .filter(Boolean);
    if (patterns.length === 0) return true;

    return patterns.some((pattern) => {
        if (pattern.endsWith('*')) {
            return ref.startsWith(pattern.slice(0, -1));
        }
        return ref === pattern;
    });
}

function readTriggerEvents(filters: WebhookCloneFilters): WebhookEventType[] {
    const events = filters.triggerEvents?.filter((event) => WEBHOOK_TRIGGER_EVENTS.includes(event));
    return events?.length ? events : DEFAULT_TRIGGER_EVENTS;
}

function readMergeRequestActions(filters: WebhookCloneFilters): MergeRequestAction[] {
    const actions = filters.mergeRequestActions?.filter((action) => MERGE_REQUEST_ACTIONS.includes(action));
    return actions?.length ? actions : DEFAULT_MERGE_REQUEST_ACTIONS;
}

export function matchesWebhookTrigger(
    filters: WebhookCloneFilters,
    trigger: WebhookTrigger,
    branch: string,
): WebhookTriggerMatch {
    const enabledEvents = readTriggerEvents(filters);
    if (!enabledEvents.includes(trigger.event)) {
        return { matched: false, reason: 'event-filter', detail: trigger.event };
    }

    if (trigger.event === 'merge_request') {
        const action = trigger.mergeRequestAction;
        if (!action || !readMergeRequestActions(filters).includes(action)) {
            return { matched: false, reason: 'merge-request-action', detail: action ?? 'unknown' };
        }
    }

    if (trigger.event === 'tag' && filters.tagFilter) {
        const tagName = trigger.tagName ?? branch;
        if (!matchesRefFilter(tagName, filters.tagFilter)) {
            return { matched: false, reason: 'tag-filter', detail: tagName };
        }
    }

    if (filters.branchFilter) {
        const branchToMatch = trigger.event === 'push' ? branch : trigger.targetBranch;
        if (branchToMatch && !matchesRefFilter(branchToMatch, filters.branchFilter)) {
            return { matched: false, reason: 'branch-filter', detail: branchToMatch };
        }
    }

    return { matched: true };
}
