export function stripLeadingSlash(name: string) {
    return name.startsWith('/') ? name.slice(1) : name;
}

export function getHostname(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
        return new URL(url).hostname;
    } catch {
        return null;
    }
}
