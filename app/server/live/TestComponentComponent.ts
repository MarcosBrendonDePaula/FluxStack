// 🔥 TestComponent - Live Component
import { LiveComponent } from "@/core/types/types";

interface TestComponentState {
  message: string;
  count: number;
  lastUpdated: Date;
}

export class TestComponentComponent extends LiveComponent<TestComponentState> {
  constructor(initialState: TestComponentState, ws: any, options?: { room?: string; userId?: string }) {
    super({
      message: "Hello from TestComponent!",
      count: 0,
      lastUpdated: new Date(),
      ...initialState
    }, ws, options);
    
    console.log(`🔥 ${this.constructor.name} component created: ${this.id}`);
  }

  async updateMessage(payload: { message: string }) {
    const { message } = payload;
    
    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }
    
    this.setState({
      message: message.trim(),
      lastUpdated: new Date()
    });
    
    // Broadcast to room if in multi-user mode
    if (this.room) {
      this.broadcast('MESSAGE_UPDATED', {
        message: message.trim(),
        userId: this.userId
      });
    }
    
    console.log(`📝 Message updated: "${message}"`);
    return { success: true, message: message.trim() };
  }

  async incrementCounter() {
    const newCount = this.state.count + 1;
    
    this.setState({
      count: newCount,
      lastUpdated: new Date()
    });
    
    if (this.room) {
      this.broadcast('COUNTER_INCREMENTED', {
        count: newCount,
        userId: this.userId
      });
    }
    
    return { success: true, count: newCount };
  }

  async resetData() {
    this.setState({
      message: "Hello from TestComponent!",
      count: 0,
      lastUpdated: new Date()
    });
    
    return { success: true };
  }

  async getData() {
    return {
      success: true,
      data: {
        ...this.state,
        componentId: this.id,
        room: this.room,
        userId: this.userId
      }
    };
  }
}