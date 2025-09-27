import React from 'react';
import { useHybridLiveComponent } from '@/app/client/src/hooks/useHybridLiveComponent';

interface TestComponentState {
  message: string;
}

const initialState: TestComponentState = {
  message: "Loading...",
};

export function TestComponent() {
  const { state, call, connected } = useHybridLiveComponent<TestComponentState>('TestComponent', initialState);

  if (!connected) {
    return <div>Connecting to TestComponent...</div>;
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem' }}>
      <h2>TestComponent Live Component</h2>
      <p>Server message: <strong>{state.message}</strong></p>
      <button onClick={() => call('updateMessage', { message: 'Hello from the client!' })}>
        Update Message
      </button>
    </div>
  );
}