export function runToolAction(action?: () => unknown): void {
    if (!action) return;

    try {
        Promise.resolve(action()).catch((error: unknown) => {
            console.error('Tool action failed:', error);
        });
    } catch (error) {
        console.error('Tool action failed:', error);
    }
}
