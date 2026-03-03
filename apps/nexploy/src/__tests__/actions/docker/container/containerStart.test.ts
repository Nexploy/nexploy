import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onContainerStartAction } from '@/actions/docker/container/containerStart.action';

const mockCtx = { session: { user: { id: 'u1', role: 'admin', banned: false } } };
const mockJson = vi.fn();
const mockPost = vi.fn(() => ({ json: mockJson }));
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

vi.mock('@/lib/api/kyDocker', () => ({ kyDocker: { post: mockPost } }));
vi.mock('@/lib/toastServer', () => ({ setToastServer: mockSetToast }));

describe('onContainerStartAction', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls kyDocker.post with the correct endpoint and returns the response', async () => {
        mockJson.mockResolvedValue({ success: true });

        const result = await onContainerStartAction({ containerId: 'c1' });

        expect(mockPost).toHaveBeenCalledWith('container/c1/start');
        expect(result?.data).toEqual({ success: true });
    });

    it('calls setToastServer on HTTPError', async () => {
        const { HTTPError } = await import('ky');
        const err = new HTTPError(
            new Response(null, { status: 500 }),
            new Request('http://test'),
            {} as any,
        );
        mockJson.mockRejectedValue(err);

        const result = await onContainerStartAction({ containerId: 'c1' });

        expect(mockSetToast).toHaveBeenCalledWith({ type: 'error', message: expect.any(String) });
        expect(result?.data).toBeUndefined();
    });

    it('does not call setToastServer for non-HTTPError', async () => {
        mockJson.mockRejectedValue(new Error('network error'));

        const result = await onContainerStartAction({ containerId: 'c1' });

        expect(mockSetToast).not.toHaveBeenCalled();
        expect(result?.data).toBeUndefined();
    });
});
