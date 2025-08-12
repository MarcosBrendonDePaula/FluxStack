import type Elysia from "elysia";
import type { ElysiaWS } from "elysia/ws";

type State = Record<string, any>;

export type LiveActionRequest = {
    componentId:string,
    componentName: string, 
    clientState: State, 
    methodName: string, 
    params: any[], 
    ws:ElysiaWS
}

export abstract class LiveAction {
    private static registry = new Map<string, typeof LiveAction>();

    public $ID!:string;

    public ws!:ElysiaWS;

    [key: string]: any;

    public static add(actionClass: typeof LiveAction) {
        const componentName = (actionClass as any).name;
        if (!componentName) {
            console.error("LiveAction class must have a static 'name' property.");
            return;
        }
        this.registry.set(componentName.toLowerCase(), actionClass);
    }

    public static get(name: string): typeof LiveAction | undefined {
        return this.registry.get(name.toLowerCase());
    }

    private static hydrate(instance: LiveAction, state: State) {
        for (const key in state) {
            if (Object.prototype.hasOwnProperty.call(state, key)) {
                // Avoid overwriting methods or internal properties
                if (typeof instance[key] !== 'function') {
                    instance[key] = state[key];
                }
            }
        }
    }

    public static trigger(opts:LiveActionRequest): State | null {
        const ActionClass = this.get(opts.componentName);
        if (!ActionClass) {
            console.error(`No action class found for component: ${opts.componentName}`);
            return null;
        }
        
        // The constructor no longer needs a callback
        //@ts-expect-error
        const instance: LiveAction = new (ActionClass)() ;

        instance.ws = opts.ws;

        this.hydrate(instance, {...opts.clientState, $ID:opts.componentId});

        const method = instance[opts.methodName];
        if (typeof method === 'function') {
            const result = method.apply(instance, opts.params);
            if(result instanceof Promise){
                instance.ws.send(JSON.stringify({
                    updates:[
                        {
                            type: "promisse",
                            id: t
                        }
                    ]
                }))
                return;
            }
        } else {
            console.warn(`Method '${opts.methodName}' not found on component '${opts.componentName}'.`);
            return null; // Or return current state?
        }

        // Return the new state of the instance
        const newState: State = {};
        for (const key in instance) {
            if (typeof instance[key] !== 'function') {
                newState[key] = instance[key];
            }
        }
        return newState;
    }

    // This is no longer needed in a stateless model
    // protected updateState() {}

    // Lifecycle methods might not be applicable in a stateless model,
    // but can be kept for potential future use or special initialization logic.
    public mount?(): void;
    public unmount?(): void;
}