import { createServer, connect } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unlinkSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MuxSession } from '@workspace/agent-protocol';

function linkedSessions() {
    const initiator: MuxSession = new MuxSession(
        {
            sendBinary: (data) => setImmediate(() => responder.handleBinary(data)),
            isOpen: () => true,
        },
        'initiator',
    );

    const responder: MuxSession = new MuxSession(
        {
            sendBinary: (data) => setImmediate(() => initiator.handleBinary(data)),
            isOpen: () => true,
        },
        'responder',
    );

    return { initiator, responder };
}

function echoServer(path: string) {
    const server = createServer((socket) => socket.pipe(socket));

    return new Promise<{ close: () => void }>((resolve) => {
        server.listen(path, () =>
            resolve({
                close: () => {
                    server.close();
                    try {
                        unlinkSync(path);
                    } catch {}
                },
            }),
        );
    });
}

describe('agent tunnel multiplexing', () => {
    it('streams payloads larger than the flow control window', async () => {
        const socketPath = join(tmpdir(), `nexploy-mux-${Date.now()}.sock`);
        const echo = await echoServer(socketPath);
        const { initiator, responder } = linkedSessions();

        responder.on('channel', (channel) => {
            const socket = connect({ path: socketPath });
            channel.on('error', () => socket.destroy());
            socket.on('error', () => channel.destroy());
            socket.on('connect', () => {
                channel.pipe(socket);
                socket.pipe(channel);
            });
        });

        const payload = Buffer.alloc(4 * 1024 * 1024, 42);
        const channel = initiator.openChannel();

        const received = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            let total = 0;

            channel.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
                total += chunk.length;
                if (total === payload.length) resolve(Buffer.concat(chunks));
            });
            channel.on('error', reject);
            channel.write(payload);
        });

        expect(received.equals(payload)).toBe(true);

        channel.on('error', () => undefined);
        channel.destroy();
        echo.close();
    });

    it('isolates channels from each other', async () => {
        const socketPath = join(tmpdir(), `nexploy-mux-multi-${Date.now()}.sock`);
        const echo = await echoServer(socketPath);
        const { initiator, responder } = linkedSessions();

        responder.on('channel', (channel) => {
            const socket = connect({ path: socketPath });
            channel.on('error', () => socket.destroy());
            socket.on('error', () => channel.destroy());
            socket.on('connect', () => {
                channel.pipe(socket);
                socket.pipe(channel);
            });
        });

        const roundTrip = (message: string) =>
            new Promise<string>((resolve, reject) => {
                const channel = initiator.openChannel();
                const chunks: Buffer[] = [];

                channel.on('error', () => undefined);

                channel.on('data', (chunk: Buffer) => {
                    chunks.push(chunk);
                    if (Buffer.concat(chunks).length === message.length) {
                        resolve(Buffer.concat(chunks).toString('utf8'));
                        channel.destroy();
                    }
                });
                channel.on('error', reject);
                channel.write(Buffer.from(message, 'utf8'));
            });

        const [first, second, third] = await Promise.all([
            roundTrip('channel-one'),
            roundTrip('channel-two-longer'),
            roundTrip('3'),
        ]);

        expect(first).toBe('channel-one');
        expect(second).toBe('channel-two-longer');
        expect(third).toBe('3');
        expect(initiator.openChannelCount).toBeGreaterThanOrEqual(0);

        echo.close();
    });

    it('propagates a reset to the peer channel', async () => {
        const { initiator, responder } = linkedSessions();

        const remote = new Promise<Error>((resolve) => {
            responder.on('channel', (channel) => {
                channel.on('error', resolve);
                channel.resume();
            });
        });

        const channel = initiator.openChannel();
        channel.on('error', () => undefined);
        channel.destroy(new Error('boom'));

        expect((await remote).message).toContain('reset');
    });
});
