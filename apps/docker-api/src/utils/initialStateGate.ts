type AsyncHandler<T> = (event: T) => Promise<void>;

export interface InitialStateGate {
    gate<T>(handler: AsyncHandler<T>): AsyncHandler<T>;
    release(): Promise<void>;
}

export function createInitialStateGate(): InitialStateGate {
    const pending: Array<() => Promise<void>> = [];
    let released = false;

    return {
        gate<T>(handler: AsyncHandler<T>): AsyncHandler<T> {
            return async (event: T) => {
                if (released) {
                    await handler(event);
                    return;
                }
                pending.push(() => handler(event));
            };
        },

        async release(): Promise<void> {
            released = true;
            const queued = pending.splice(0, pending.length);

            for (const run of queued) {
                await run();
            }
        },
    };
}
