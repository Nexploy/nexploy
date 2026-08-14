export const MAX_METRICS_HISTORY_SIZE = 60;

export function appendMetricsPoint<T>(history: T[], point: T, maxHistorySize = MAX_METRICS_HISTORY_SIZE): T[] {
    return [...history, point].slice(-maxHistorySize);
}
