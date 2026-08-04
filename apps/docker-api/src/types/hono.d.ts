import type { Actor } from '@nexploy/shared/actor';

declare module 'hono' {
    interface ContextVariableMap {
        actor: Actor;
    }
}
