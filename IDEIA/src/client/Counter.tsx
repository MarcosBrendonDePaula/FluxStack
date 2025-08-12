import React from 'react';
import { useLive } from './live';

const COUNTER_ID = 'my-unique-counter';

const initialState = { count: 0 };

export function Counter() {
    const { state, callMethod, isLoading } = useLive({ 
        name: 'counter', 
        id: COUNTER_ID, 
        state: initialState 
    });

    return (
        <div className="counter-container">
            <h1>Live Counter</h1>
            <p>This component's state is managed by the server.</p>
            <div className="count-display">
                Current count is: <strong>{state.count}</strong>
            </div>
            <div className="controls">
                <button onClick={() => callMethod('increment')}>Increment</button>
                <button onClick={() => callMethod('decrement')}>Decrement</button>
            </div>
        </div>
    );
}