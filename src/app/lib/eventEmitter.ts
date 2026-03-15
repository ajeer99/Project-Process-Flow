import { EventEmitter } from 'events';

// Create a custom emitter class to ensure higher listener limits if needed
class ChatEmitter extends EventEmitter {
  constructor() {
    super();
    // Allow more concurrent connections for SSE
    this.setMaxListeners(100); 
  }
}

// Ensure the emitter survives Next.js development hot reloads
const globalForChat = globalThis as unknown as {
  chatEmitter: ChatEmitter | undefined;
};

export const chatEmitter = globalForChat.chatEmitter ?? new ChatEmitter();

if (process.env.NODE_ENV !== 'production') globalForChat.chatEmitter = chatEmitter;
