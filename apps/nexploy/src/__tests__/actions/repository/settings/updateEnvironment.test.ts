import { beforeEach, describe, expect, it, vi } from 'vitest';
import { revalidatePath } from 'next/cache';
import { updateEnvironmentAction } from '@/actions/repository/settings/updateEnvironment.action';

const { mockCtx, mockUpdateEnvironmentRepository, mockSetToast } = vi.hoisted(() => ({
    mockCtx: { session: { user: { id: 'u1', role: 'admin', banned: false } } },
    mockUpdateEnvironmentRepository: vi.fn(),
    mockSetToast: vi.fn(),
}));

vi.mock('@/lib/api/safe-action', () => {
    const builder: any = {
        use: vi.fn().mockReturnThis(),
        inputSchema: vi.fn().mockReturnThis(),
        bindArgsSchemas: vi.fn().mockReturnThis(),
        action: vi.fn((fn: any) => async (input: any, ...bindArgs: any[]) => {
            const result = await fn({
                parsedInput: input,
                ctx: mockCtx,
                bindArgsParsedInputs: bindArgs,
            });
            return { data: result };
        }),
    };
    return { authActionServer: builder, requirePermission: vi.fn(() => builder) };
});

vi.mock('@/services/repository.service', () => ({
    updateEnvironmentRepository: mockUpdateEnvironmentRepository,
}));

vi.mock('@/lib/toastServer', () => ({ setToastServer: mockSetToast }));

describe('updateEnvironmentAction', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls updateEnvironmentRepository, revalidates path, and returns result', async () => {
        mockUpdateEnvironmentRepository.mockResolvedValue({
            environmentId: 'env-1',
            environment: { name: 'Production' },
        });

        const result = await updateEnvironmentAction({ environmentId: 'env-1' } as any, 'repo-1');

        expect(mockUpdateEnvironmentRepository).toHaveBeenCalledWith('env-1', 'repo-1');
        expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/repositories/repo-1');
        expect(result?.data).toEqual({ environmentId: 'env-1', environmentName: 'Production' });
    });

    it('calls setToastServer on error and returns undefined data', async () => {
        mockUpdateEnvironmentRepository.mockRejectedValue(new Error('Environment not found'));

        const result = await updateEnvironmentAction({ environmentId: 'env-1' } as any, 'repo-1');

        expect(mockSetToast).toHaveBeenCalledWith({
            type: 'error',
            message: 'Environment not found',
        });
        expect(result?.data).toBeUndefined();
    });
});
