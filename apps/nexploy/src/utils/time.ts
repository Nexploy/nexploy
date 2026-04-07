export function to24h(hour12: number, period: 'AM' | 'PM'): number {
    if (period === 'AM') return hour12 === 12 ? 0 : hour12;
    return hour12 === 12 ? 12 : hour12 + 12;
}
