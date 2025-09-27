import { LiveComponent } from "@/core/types/types";

interface TestComponentState {
  message: string;
}

export class TestComponentComponent extends LiveComponent<TestComponentState> {
  constructor(initialState: TestComponentState, ws: any, options?: { room?: string; userId?: string }) {
    super({ message: "Hello from TestComponent!", ...initialState }, ws, options);
  }

  async updateMessage(payload: { message: string }) {
    this.setState({ message: payload.message });
    return { success: true };
  }
}