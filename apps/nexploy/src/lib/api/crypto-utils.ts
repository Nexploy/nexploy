import * as crypto from 'node:crypto';

export function timingSafeEqual(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) {
        crypto.timingSafeEqual(aBuf, Buffer.alloc(aBuf.length));
        return false;
    }
    return crypto.timingSafeEqual(aBuf, bBuf);
}
