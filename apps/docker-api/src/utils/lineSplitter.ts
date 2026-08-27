import { Writable } from 'node:stream';

export interface LineSplitter extends Writable {
    end(): this;
}

export function createLineSplitter(onLine: (line: string) => void): LineSplitter {
    let buffer = '';

    const flush = () => {
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
            if (line.trim()) onLine(line);
        }
    };

    return new Writable({
        write(chunk, _encoding, callback) {
            buffer += chunk.toString();
            flush();
            callback();
        },
        final(callback) {
            if (buffer.trim()) onLine(buffer);
            buffer = '';
            callback();
        },
    }) as LineSplitter;
}
