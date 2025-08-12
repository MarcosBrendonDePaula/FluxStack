import React, { createContext, useContext, useEffect, useRef } from 'react';
import { createStore, useStore } from 'zustand';

type LiveComponent = {
    name: string;
    id: string;
    state: any;
};

type LiveState = {
    components: Record<string, any>;
    actions: {
        updateComponentState: (id: string, state: any) => void;
    };
};

const liveStore = createStore<LiveState>((set) => ({
    components: {},
    actions: {
        updateComponentState: (id, state) =>
            set((s) => ({ components: { ...s.components, [id]: state } })),
    },
}));

const WebSocketContext = createContext<{
    callMethod: (name: string, id: string, methodName: string, params: any[], state: any) => void;
} | null>(null);

export const LiveProvider = ({ children }: { children: React.ReactNode }) => {
    const ws = useRef<WebSocket | null>(null);
    const messageQueue = useRef<string[]>([]);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:3000/ws');
        ws.current = socket;

        socket.onopen = () => {
            console.log('WebSocket connected');
            // Send any queued messages
            messageQueue.current.forEach(msg => socket.send(msg));
            messageQueue.current = [];
        };

        socket.onclose = () => console.log('WebSocket disconnected');

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.updates && Array.isArray(data.updates)) {
                for (const update of data.updates) {
                    if (update.type === 'state_update') {
                        liveStore.getState().actions.updateComponentState(update.id, update.state);
                    }
                }
            }
        };
    }, []);

    const callMethod = (name: string, id: string, methodName: string, params: any[] = [], state: any) => {
        const message = JSON.stringify({
            updates: [{
                type: 'callMethod',
                payload: { name, id, methodName, params, state },
            }],
        });

        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(message);
        } else {
            console.log('WebSocket not open. Queuing message.');
            messageQueue.current.push(message);
        }
    };

    return (
        <WebSocketContext.Provider value={{ callMethod }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useLive = ({ name, id, state: initialData }: LiveComponent) => {
    const state = useStore(liveStore, (s) => s.components[id] || initialData);
    const context = useContext(WebSocketContext);

    if (!context) {
        throw new Error('useLive must be used within a LiveProvider');
    }

    return {
        state,
        callMethod: (methodName: string, ...params: any[]) => context.callMethod(name, id, methodName, params, state),
    };
};