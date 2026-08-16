import type { ActivityExportFormat, ActivityLogEntry } from '@workspace/typescript-interface/activity';

const CSV_BOM = '\uFEFF';

const CSV_COLUMNS = [
    'id',
    'createdAt',
    'name',
    'resource',
    'action',
    'status',
    'source',
    'actorType',
    'actorId',
    'actorEmail',
    'actorName',
    'actorRole',
    'organizationId',
    'targetType',
    'targetId',
    'targetName',
    'environmentId',
    'durationMs',
    'errorMessage',
    'ipAddress',
    'userAgent',
    'metadata',
] as const satisfies readonly (keyof ActivityLogEntry)[];

const EXPORT_CONTENT_TYPES: Record<ActivityExportFormat, string> = {
    csv: 'text/csv; charset=utf-8',
    json: 'application/json; charset=utf-8',
    ndjson: 'application/x-ndjson; charset=utf-8',
};

const EXPORT_EXTENSIONS: Record<ActivityExportFormat, string> = {
    csv: 'csv',
    json: 'json',
    ndjson: 'ndjson',
};

function toCsvCell(value: unknown): string {
    if (value === null || value === undefined) return '';

    const raw = typeof value === 'object' ? JSON.stringify(value) : String(value);

    return /[",\r\n]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw;
}

function toCsvRow(entry: ActivityLogEntry): string {
    return `${CSV_COLUMNS.map((column) => toCsvCell(entry[column])).join(',')}\r\n`;
}

export function getActivityExportContentType(format: ActivityExportFormat): string {
    return EXPORT_CONTENT_TYPES[format];
}

export function getActivityExportFilename(format: ActivityExportFormat, date = new Date()): string {
    const stamp = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);

    return `nexploy-activity-${stamp}.${EXPORT_EXTENSIONS[format]}`;
}

export function createActivityExportSerializer(format: ActivityExportFormat) {
    let count = 0;

    return {
        start(): string {
            if (format === 'csv') return `${CSV_BOM}${CSV_COLUMNS.join(',')}\r\n`;
            if (format === 'json') return '[';

            return '';
        },
        entry(entry: ActivityLogEntry): string {
            count += 1;

            if (format === 'csv') return toCsvRow(entry);
            if (format === 'ndjson') return `${JSON.stringify(entry)}\n`;

            return count === 1 ? JSON.stringify(entry) : `,${JSON.stringify(entry)}`;
        },
        end(): string {
            return format === 'json' ? ']' : '';
        },
    };
}
