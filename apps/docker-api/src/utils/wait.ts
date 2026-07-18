import * as fs from 'fs/promises';

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitForFile(filePath: string, timeoutMs: number): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            await wait(1000);
        }
    }

    return false;
}
