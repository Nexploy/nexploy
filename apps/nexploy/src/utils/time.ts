export function to24h(hour12: number, period: 'AM' | 'PM'): number {
    if (period === 'AM') return hour12 === 12 ? 0 : hour12;
    return hour12 === 12 ? 12 : hour12 + 12;
}

export function formatDuration(durationMs: number): string {
    if (durationMs < 1000) return `${Math.round(durationMs)}ms`;

    const totalSeconds = durationMs / 1000;
    if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`;

    const totalMinutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    if (totalMinutes < 60) return `${totalMinutes}m ${seconds}s`;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
}
