import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-cbc';
const PREFIX = 'nex:';

const SCRYPT_SALT = Buffer.from('nexploy-aes-key', 'utf8');
const getKey = () => crypto.scryptSync(String(ENCRYPTION_KEY), SCRYPT_SALT, 32);

export function encrypt(text: string): string {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return `${PREFIX}${iv.toString('hex')}:${encrypted.toString('hex')}`;
    } catch {
        return text;
    }
}

export function decrypt(text: string): string {
    if (!text) return text;

    if (!text.startsWith(PREFIX)) {
        return text;
    }

    try {
        const parts = text.slice(PREFIX.length).split(':');
        if (parts.length !== 2) return text;

        const iv = Buffer.from(parts[0]!, 'hex');
        const encryptedText = Buffer.from(parts[1]!, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch {
        return text;
    }
}
