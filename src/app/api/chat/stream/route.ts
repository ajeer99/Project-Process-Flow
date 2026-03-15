import { NextRequest } from 'next/server';
import { auth } from '../../../../../auth';
import { chatEmitter } from '@/app/lib/eventEmitter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;

    // Use a TransformStream for SSE
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Health ping to keep socket alive
    const interval = setInterval(() => {
        writer.write(encoder.encode(`:ping\n\n`));
    }, 15000);

    // Event listener for incoming chat messages
    const handleNewMessage = (payload: any) => {
        if (payload.receiverId === userId) {
            writer.write(encoder.encode(`event: message\ndata: ${JSON.stringify(payload)}\n\n`));
        }
    };

    // Event listener for incoming typing indicators
    const handleTyping = (payload: any) => {
        if (payload.receiverId === userId) {
            writer.write(encoder.encode(`event: typing\ndata: ${JSON.stringify(payload)}\n\n`));
        }
    };

    // Event listener for notifications
    const handleNotification = (payload: any) => {
        if (payload.receiverId === userId) {
            writer.write(encoder.encode(`event: notification\ndata: ${JSON.stringify(payload)}\n\n`));
        }
    };

    chatEmitter.on('chat:message', handleNewMessage);
    chatEmitter.on('chat:typing', handleTyping);
    chatEmitter.on('notification:new', handleNotification);

    req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        chatEmitter.off('chat:message', handleNewMessage);
        chatEmitter.off('chat:typing', handleTyping);
        chatEmitter.off('notification:new', handleNotification);
        writer.close().catch(() => {});
    });

    return new Response(stream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Important for Nginx environments
        },
    });
}
