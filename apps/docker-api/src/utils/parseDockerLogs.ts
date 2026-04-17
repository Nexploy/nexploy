export function parseDockerLogs(buffer: Buffer): string {
    if (!Buffer.isBuffer(buffer)) return String(buffer);
    let output = '';
    let offset = 0;
    while (offset + 8 <= buffer.length) {
        const size = buffer.readUInt32BE(offset + 4);
        if (offset + 8 + size > buffer.length) break;
        output += buffer.slice(offset + 8, offset + 8 + size).toString('utf8');
        offset += 8 + size;
    }
    return output.trim();
}
