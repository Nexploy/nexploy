import { z } from 'zod';

export const certTypeSchema = z.enum(['LETS_ENCRYPT', 'CUSTOM']);

export const createLetsEncryptCertSchema = z.object({
    name: z.string().min(1, "Name can't be empty"),
    domain: z.string().min(1, "Domain can't be empty"),
    email: z.email(),
    agreedToTos: z
        .boolean()
        .refine((v) => v, { message: 'You must agree to the Terms of Service' }),
});

export const createCustomCertSchema = z.object({
    name: z.string().min(1, "Name can't be empty"),
    domain: z.string().min(1, "Domain can't be empty"),
    certificate: z.string().min(1, "Certificate can't be empty"),
    privateKey: z.string().min(1, "Private key can't be empty"),
});

export const deleteCertSchema = z.object({
    id: z.string().min(1, "ID can't be empty"),
});

export const sslCertificateSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: certTypeSchema,
    domain: z.string(),
    expiresAt: z.date().nullable(),
    createdAt: z.date(),
});

export type SslCertificate = z.infer<typeof sslCertificateSchema>;
export type CertType = z.infer<typeof certTypeSchema>;
export type CreateLetsEncryptCert = z.infer<typeof createLetsEncryptCertSchema>;
export type CreateCustomCert = z.infer<typeof createCustomCertSchema>;
