import * as net from 'node:net';

export function checkPort(host: string, port: number, timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let resolved = false;

        const done = (result: boolean) => {
            if (!resolved) {
                resolved = true;
                socket.destroy();
                resolve(result);
            }
        };

        socket.setTimeout(timeoutMs);
        socket.once('connect', () => done(true));
        socket.once('error', () => done(false));
        socket.once('timeout', () => done(false));
        socket.connect(port, host);
    });
}
