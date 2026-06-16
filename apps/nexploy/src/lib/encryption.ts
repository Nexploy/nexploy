import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';
const PREFIX = 'nex:';

const SCRYPT_SALT = Buffer.from('nexploy-aes-key', 'utf8');
const getKey = () => {
    if (!ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY is not set — cannot encrypt/decrypt sensitive data');
    }
    return crypto.scryptSync(ENCRYPTION_KEY, SCRYPT_SALT, 32);
};

export function encrypt(text: string): string {
    if (!text) return text;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv) as crypto.CipherGCM;
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(text: string): string {
    if (!text) return text;

    if (!text.startsWith(PREFIX)) {
        return text;
    }

    try {
        const parts = text.slice(PREFIX.length).split(':');
        if (parts.length !== 3) return text;

        const iv = Buffer.from(parts[0]!, 'hex');
        const authTag = Buffer.from(parts[1]!, 'hex');
        const encryptedText = Buffer.from(parts[2]!, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv) as crypto.DecipherGCM;
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch {
        return text;
    }
}
