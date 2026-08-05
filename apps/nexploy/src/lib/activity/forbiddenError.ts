export class ForbiddenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ForbiddenError';
    }
}

export function isForbiddenError(error: unknown): boolean {
    return error instanceof ForbiddenError || (error instanceof Error && error.name === 'ForbiddenError');
}
