export function parentDir(path: string): string {
    return path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
}

export function canDropInto(sourcePath: string | null | undefined, destDir: string): boolean {
    if (!sourcePath) return false;
    if (destDir === sourcePath) return false;
    if (destDir.startsWith(`${sourcePath}/`)) return false;
    if (parentDir(sourcePath) === destDir) return false;
    return true;
}
