import { ContentfulStatusCode } from 'hono/utils/http-status';

export class ApiError extends Error {
    status: ContentfulStatusCode | undefined

    constructor(status: ContentfulStatusCode | undefined, message: string) {
        super(message)
        this.status = status
        this.name = 'ApiError'
    }
}

export function mapDockerError(err: any) {

    const message = err?.reason || err?.message || String(err)
    const status = err?.statusCode || (message.includes('not found') ? 404 : 500)
    return new ApiError(status, message)
}
