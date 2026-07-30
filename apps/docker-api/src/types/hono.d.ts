import type { Actor } from '@workspace/shared/actor';

declare module 'hono' {
    interface ContextVariableMap {
        actor: Actor;
    }
}
