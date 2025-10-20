import { createZodRoute } from 'next-zod-route';
import { NextResponse } from 'next/server';

export const route = createZodRoute({
    handleServerError: (error: Error) => {
        console.error(`[SERVER ERROR] ${error.message}`, error);
        return NextResponse.json({ message: error.message });
    },
});
