import React from 'react';
import { useHybridLiveComponent } from '../hooks/useHybridLiveComponent';

interface UserProfileState {
  message: string;
}

const initialState: UserProfileState = {
  message: "Loading...",
};

export function UserProfile() {
  const { state, call, connected } = useHybridLiveComponent<UserProfileState>('UserProfile', initialState);

  if (!connected) {
    return <div>Connecting to UserProfile...</div>;
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem' }}>
      <h2>UserProfile Live Component</h2>
      <p>Server message: <strong>{state.message}</strong></p>
      <button onClick={() => call('updateMessage', { message: 'Hello from the client!' })}>
        Update Message
      </button>
    </div>
  );
}