import { z } from 'zod';

const portMappingSchema = z
    .object({
        typeAction: z.enum(['add', 'delete', 'edit']),
        privatePort: z.number().optional(),
        currentPrivatePort: z.number().optional(),
        publicPort: z.number().optional(),
        currentPublicPort: z.number().optional(),
        type: z.enum(['tcp', 'udp', 'sctp']).optional(),
        currentType: z.enum(['tcp', 'udp', 'sctp']).optional(),
    })
    .refine((data) => {
        if (data.typeAction === 'edit' || data.typeAction === 'delete') {
            return data.currentPublicPort && data.currentPrivatePort && data.currentType;
        }
        return true;
    });

export const ContainerRecreateFormSchema = z.object({
    containerId: z.string(),
    ports: z.array(portMappingSchema).default([]),
});

export type Port = z.infer<typeof portMappingSchema>;

export type ContainerRecreateForm = z.infer<typeof ContainerRecreateFormSchema>;
