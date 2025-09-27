import { LiveComponent } from "@/core/types/types";

interface UserProfileState {
  message: string;
}

export class UserProfileComponent extends LiveComponent<UserProfileState> {
  constructor(initialState: UserProfileState, ws: any, options?: { room?: string; userId?: string }) {
    super({ message: "Hello from UserProfile!", ...initialState }, ws, options);
  }

  async updateMessage(payload: { message: string }) {
    this.setState({ message: payload.message });
    return { success: true };
  }
}