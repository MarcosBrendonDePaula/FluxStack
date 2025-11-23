// 🔥 TestComponent - Client Component
import { useTypedLiveComponent } from '@/core/client';
import type { InferComponentState } from '@/core/client';

// Import component type DIRECTLY from backend - full type inference!
import type { TestComponentComponent } from '@/server/live/TestComponentComponent';

// State type inferred from backend component
type TestComponentState = InferComponentState<TestComponentComponent>;

const initialState: TestComponentState = {
  message: "Loading...",
  count: 0,
  lastUpdated: new Date(),
};

export function TestComponent() {
  const { state, call, connected, loading } = useTypedLiveComponent<TestComponentComponent>('TestComponent', initialState);

  if (!connected) {
    return (
      <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Connecting to TestComponent...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 m-4 relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">TestComponent Live Component</h2>
        <span className={
          `px-2 py-1 rounded-full text-xs font-medium ${
            connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`
        }>
          {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-gray-600 mb-2">Server message:</p>
          <p className="text-lg font-semibold text-blue-600">{state.message}</p>
        </div>
        
        <div>
          <p className="text-gray-600 mb-2">Counter: <span className="font-bold text-2xl">{state.count}</span></p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => call('updateMessage', { message: 'Hello from the client!' })}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📝 Update Message
          </button>
          
          <button
            onClick={() => call('incrementCounter', {})}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ➕ Increment
          </button>

          <button
            onClick={() => call('resetData', {})}
            disabled={loading}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔄 Reset
          </button>

          <button
            onClick={async () => {
              const result = await call('getData', {});
              console.log('Component data:', result);
              alert('Data logged to console');
            }}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📊 Get Data
          </button>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Last updated: {new Date(state.lastUpdated).toLocaleTimeString()}
      </div>
      
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}