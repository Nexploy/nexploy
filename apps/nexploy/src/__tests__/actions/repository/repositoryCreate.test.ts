import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRepositoryCreateAction } from '@/actions/repository/repositoryCreate.action';

const mockCtx = { session: { user: { id: 'u1', role: 'admin', banned: false } } };
const mockCreateRepository = vi.fn();
const mockSetToast = vi.fn();

vi.mock('@/lib/api/safe-action', () => {
    const builder: any = {
        use: vi.fn().mockReturnThis(),
        inputSchema: vi.fn().mockReturnThis(),
        action: vi.fn((fn: any) => async (input: any) => {
            const result = await fn({ parsedInput: input, ctx: mockCtx });
            return { data: result };
        }),
    };
    return { authActionServer: builder, requirePermission: vi.fn(() => builder) };
});

vi.mock('@/services/repository.service', () => ({
    createRepository: mockCreateRepository,
}));

vi.mock('@/lib/toastServer', () => ({ setToastServer: mockSetToast }));

const REPO_INPUT = { name: 'my-app', gitUrl: 'https://github.com/user/repo', branch: 'main' };

describe('onRepositoryCreateAction', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls createRepository with parsedInput and ctx and returns the result', async () => {
        mockCreateRepository.mockResolvedValue({ id: 'repo-1', name: 'my-app' });

        const result = await onRepositoryCreateAction(REPO_INPUT as any);

        expect(mockCreateRepository).toHaveBeenCalledWith(REPO_INPUT, mockCtx);
        expect(result?.data).toEqual({ id: 'repo-1', name: 'my-app' });
    });

    it('calls setToastServer on error and returns undefined data', async () => {
        mockCreateRepository.mockRejectedValue(new Error('Name already taken'));

        const result = await onRepositoryCreateAction(REPO_INPUT as any);

        expect(mockSetToast).toHaveBeenCalledWith({ type: 'error', message: 'Name already taken' });
        expect(result?.data).toBeUndefined();
    });
});
