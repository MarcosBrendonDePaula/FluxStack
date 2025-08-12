import { Elysia } from "elysia";
import index from "../client/index.html";
import { LiveAction } from "./live-action";

// Import all action classes to ensure they are registered.
import "./actions/counter.action.ts";

const app = new Elysia()
    .get("/", index)
    .ws("/ws", {
        open(ws) {
            console.log(`Client connected: ${ws.id}`);
        },
        async message(ws, message: any) {
            const parsedMessage = message;
            let result: any = { updates: [] };

            if (parsedMessage.updates && Array.isArray(parsedMessage.updates)) {
                for (const update of parsedMessage.updates) {
                    if (update.type === 'callMethod') {
                        const { payload } = update;
                        const { name: componentName, id: instanceId, methodName, params, state: clientState } = payload;
                        const newState = LiveAction.trigger({
                            componentName, 
                            clientState, 
                            methodName, 
                            params, 
                            ws,
                            componentId: instanceId
                        });
                        if (newState) {
                            result.updates.push({
                                type: "state_update",
                                id: instanceId,
                                state: newState,
                            });
                        }
                    }
                }
            }

            if (ws.raw.readyState === WebSocket.OPEN && result.updates.length > 0) {
                ws.send(JSON.stringify(result));
            }
        },
        close(ws) {
            console.log(`Client disconnected: ${ws.id}`);
            // No cleanup needed for instances anymore
        },
    })
    .listen(3000);

console.log(`Server listening on http://localhost:${app.server?.port}`);

export type App = typeof app;