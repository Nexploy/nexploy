const BLOCK_SIZE = 512;

function writeOctal(header: Buffer, value: number, offset: number, length: number): void {
    const octal = value.toString(8).padStart(length - 1, '0');
    header.write(`${octal}\0`, offset, length, 'ascii');
}

export function createSingleFileTar(fileName: string, content: Buffer): Buffer {
    const header = Buffer.alloc(BLOCK_SIZE);

    header.write(fileName, 0, 100, 'utf8');
    header.write('0000644\0', 100, 8, 'ascii');
    header.write('0000000\0', 108, 8, 'ascii');
    header.write('0000000\0', 116, 8, 'ascii');
    writeOctal(header, content.length, 124, 12);
    writeOctal(header, Math.floor(Date.now() / 1000), 136, 12);
    header.write('        ', 148, 8, 'ascii');
    header.write('0', 156, 1, 'ascii');
    header.write('ustar\0', 257, 6, 'ascii');
    header.write('00', 263, 2, 'ascii');

    const checksum = header.reduce((total, byte) => total + byte, 0);
    header.write(`${checksum.toString(8).padStart(6, '0')}\0 `, 148, 8, 'ascii');

    const padding = Buffer.alloc((BLOCK_SIZE - (content.length % BLOCK_SIZE)) % BLOCK_SIZE);

    return Buffer.concat([header, content, padding, Buffer.alloc(BLOCK_SIZE * 2)]);
}
