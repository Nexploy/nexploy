export class HttpError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        Object.setPrototypeOf(this, HttpError.prototype);
    }
}
