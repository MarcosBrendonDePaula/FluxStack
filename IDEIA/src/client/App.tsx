import React from 'react';
import { LiveProvider } from './live';
import { Counter } from './Counter';

export function App() {
    return (
        <LiveProvider>
            <main>
                <Counter />
            </main>
        </LiveProvider>
    );
}