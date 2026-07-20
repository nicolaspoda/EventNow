import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type Handler = (...args: unknown[]) => void;

interface FakeSocket {
  connected: boolean;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  trigger: (event: string, ...args: unknown[]) => void;
}

function createFakeSocket(): FakeSocket {
  const listeners = new Map<string, Handler[]>();
  const socket: FakeSocket = {
    connected: false,
    on: vi.fn((event: string, handler: Handler) => {
      const handlers = listeners.get(event) ?? [];
      handlers.push(handler);
      listeners.set(event, handlers);
    }),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(() => {
      socket.connected = false;
    }),
    trigger: (event: string, ...args: unknown[]) => {
      (listeners.get(event) ?? []).forEach((handler) => handler(...args));
    },
  };
  return socket;
}

const ioMock = vi.fn();

vi.mock('socket.io-client', () => ({
  default: (...args: unknown[]) => ioMock(...args),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let socketService: typeof import('../services/socketService')['socketService'];
let fakeSocket: FakeSocket;

beforeEach(async () => {
  vi.resetModules();
  ioMock.mockReset();
  fakeSocket = createFakeSocket();
  ioMock.mockReturnValue(fakeSocket);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  ({ socketService } = await import('../services/socketService'));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('socketService.connect', () => {
  it('connects to the /messages namespace with the token and resolves on "connect"', async () => {
    const promise = socketService.connect('my-token');
    fakeSocket.connected = true;
    fakeSocket.trigger('connect');

    await expect(promise).resolves.toBeUndefined();
    expect(ioMock).toHaveBeenCalledWith(
      'http://localhost:3000/messages',
      expect.objectContaining({
        path: '/socket.io',
        auth: { token: 'my-token' },
      }),
    );
  });

  it('resolves immediately without reconnecting if already connected', async () => {
    const first = socketService.connect('my-token');
    fakeSocket.connected = true;
    fakeSocket.trigger('connect');
    await first;

    await expect(socketService.connect('my-token')).resolves.toBeUndefined();
    expect(ioMock).toHaveBeenCalledTimes(1);
  });

  it('rejects once connect_error fires maxReconnectAttempts times', async () => {
    const promise = socketService.connect('my-token');

    for (let i = 0; i < 5; i++) {
      fakeSocket.trigger('connect_error', new Error('boom'));
    }

    await expect(promise).rejects.toThrow('Failed to connect to WebSocket server');
  });

  it('rejects after a 10s timeout when no connect event arrives', async () => {
    vi.useFakeTimers();
    const promise = socketService.connect('my-token');
    const assertion = expect(promise).rejects.toThrow('Connection timeout');

    await vi.advanceTimersByTimeAsync(10_000);

    await assertion;
  });

  it('resets the reconnect attempt counter on a successful connect', async () => {
    const promise = socketService.connect('my-token');
    fakeSocket.trigger('connect_error', new Error('boom'));
    fakeSocket.connected = true;
    fakeSocket.trigger('connect');

    await expect(promise).resolves.toBeUndefined();
  });

  it('emits a socketReconnected event to registered listeners once connected', async () => {
    const handler = vi.fn();
    socketService.on('socketReconnected', handler);

    const promise = socketService.connect('my-token');
    fakeSocket.connected = true;
    fakeSocket.trigger('connect');
    await promise;

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('socketService.disconnect', () => {
  it('disconnects the underlying socket and resets connection state', async () => {
    const promise = socketService.connect('my-token');
    fakeSocket.connected = true;
    fakeSocket.trigger('connect');
    await promise;

    socketService.disconnect();

    expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1);
    expect(socketService.isConnected()).toBe(false);
  });

  it('does nothing when there is no active socket', () => {
    expect(() => socketService.disconnect()).not.toThrow();
  });
});

describe('socketService.isConnected', () => {
  it('reflects the underlying socket connection state', async () => {
    expect(socketService.isConnected()).toBe(false);

    const promise = socketService.connect('my-token');
    fakeSocket.connected = true;
    fakeSocket.trigger('connect');
    await promise;

    expect(socketService.isConnected()).toBe(true);
  });
});

describe('socketService room/message actions when connected', () => {
  beforeEach(async () => {
    const promise = socketService.connect('my-token');
    fakeSocket.connected = true;
    fakeSocket.trigger('connect');
    await promise;
    fakeSocket.emit.mockClear();
  });

  it('joinConversation emits and resolves on a successful ack', async () => {
    const promise = socketService.joinConversation('c1');
    const [event, payload, ack] = fakeSocket.emit.mock.calls[0];
    expect(event).toBe('joinConversation');
    expect(payload).toEqual({ conversationId: 'c1' });

    (ack as Handler)({});
    await expect(promise).resolves.toBeUndefined();
  });

  it('joinConversation rejects on an ack error', async () => {
    const promise = socketService.joinConversation('c1');
    const [, , ack] = fakeSocket.emit.mock.calls[0];

    (ack as Handler)({ error: 'nope' });
    await expect(promise).rejects.toThrow('nope');
  });

  it('leaveConversation emits the conversation id', () => {
    socketService.leaveConversation('c1');
    expect(fakeSocket.emit).toHaveBeenCalledWith('leaveConversation', { conversationId: 'c1' });
  });

  it('sendMessage emits and resolves with the returned message on success', async () => {
    const promise = socketService.sendMessage('c1', 'hello');
    const [event, payload, ack] = fakeSocket.emit.mock.calls[0];
    expect(event).toBe('sendMessage');
    expect(payload).toEqual({ conversationId: 'c1', content: 'hello' });

    const message = { id: 'm1', content: 'hello' };
    (ack as Handler)({ message });
    await expect(promise).resolves.toEqual(message);
  });

  it('sendMessage rejects on an ack error', async () => {
    const promise = socketService.sendMessage('c1', 'hello');
    const [, , ack] = fakeSocket.emit.mock.calls[0];

    (ack as Handler)({ error: 'send failed' });
    await expect(promise).rejects.toThrow('send failed');
  });

  it('sendTypingIndicator emits the typing state', () => {
    socketService.sendTypingIndicator('c1', true);
    expect(fakeSocket.emit).toHaveBeenCalledWith('typing', { conversationId: 'c1', isTyping: true });
  });

  it('joinEventRoom emits and resolves on a successful ack', async () => {
    const promise = socketService.joinEventRoom('e1');
    const [event, payload, ack] = fakeSocket.emit.mock.calls[0];
    expect(event).toBe('joinEventRoom');
    expect(payload).toEqual({ eventId: 'e1' });

    (ack as Handler)({});
    await expect(promise).resolves.toBeUndefined();
  });

  it('joinEventRoom rejects on an ack error', async () => {
    const promise = socketService.joinEventRoom('e1');
    const [, , ack] = fakeSocket.emit.mock.calls[0];

    (ack as Handler)({ error: 'join failed' });
    await expect(promise).rejects.toThrow('join failed');
  });

  it('leaveEventRoom emits the event id', () => {
    socketService.leaveEventRoom('e1');
    expect(fakeSocket.emit).toHaveBeenCalledWith('leaveEventRoom', { eventId: 'e1' });
  });
});

describe('socketService room/message actions when not connected', () => {
  it('joinConversation rejects immediately without emitting', async () => {
    await expect(socketService.joinConversation('c1')).rejects.toThrow('Socket not connected');
    expect(fakeSocket.emit).not.toHaveBeenCalled();
  });

  it('leaveConversation does nothing', () => {
    expect(() => socketService.leaveConversation('c1')).not.toThrow();
    expect(fakeSocket.emit).not.toHaveBeenCalled();
  });

  it('sendMessage rejects immediately without emitting', async () => {
    await expect(socketService.sendMessage('c1', 'hi')).rejects.toThrow('Socket not connected');
    expect(fakeSocket.emit).not.toHaveBeenCalled();
  });

  it('sendTypingIndicator does nothing', () => {
    expect(() => socketService.sendTypingIndicator('c1', true)).not.toThrow();
    expect(fakeSocket.emit).not.toHaveBeenCalled();
  });

  it('joinEventRoom rejects immediately without emitting', async () => {
    await expect(socketService.joinEventRoom('e1')).rejects.toThrow('Socket not connected');
    expect(fakeSocket.emit).not.toHaveBeenCalled();
  });

  it('leaveEventRoom does nothing', () => {
    expect(() => socketService.leaveEventRoom('e1')).not.toThrow();
    expect(fakeSocket.emit).not.toHaveBeenCalled();
  });
});

describe('socketService.on / off', () => {
  it('forwards server events to registered handlers', async () => {
    const handler = vi.fn();
    socketService.on('newMessage', handler);

    const promise = socketService.connect('my-token');
    fakeSocket.connected = true;
    fakeSocket.trigger('connect');
    await promise;

    const data = { conversationId: 'c1', message: { id: 'm1' } };
    fakeSocket.trigger('newMessage', data);

    expect(handler).toHaveBeenCalledWith(data);
  });

  it('stops forwarding events once a handler is removed via off', async () => {
    const handler = vi.fn();
    socketService.on('newMessage', handler);
    socketService.off('newMessage', handler);

    const promise = socketService.connect('my-token');
    fakeSocket.connected = true;
    fakeSocket.trigger('connect');
    await promise;

    fakeSocket.trigger('newMessage', { conversationId: 'c1', message: {} });

    expect(handler).not.toHaveBeenCalled();
  });

  it('isolates a handler that throws so other handlers still run', async () => {
    const throwing = vi.fn(() => {
      throw new Error('handler error');
    });
    const ok = vi.fn();
    socketService.on('newNotification', throwing);
    socketService.on('newNotification', ok);

    const promise = socketService.connect('my-token');
    fakeSocket.connected = true;
    fakeSocket.trigger('connect');
    await promise;

    expect(() => fakeSocket.trigger('newNotification')).not.toThrow();
    expect(ok).toHaveBeenCalledTimes(1);
  });
});
