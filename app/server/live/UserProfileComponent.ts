// 🔥 User Profile - Live Component
import { LiveComponent } from "@/core/types/types";

interface UserProfileState {
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  bio: string;
  location: string;
  joinedDate: string;
  followers: number;
  following: number;
  posts: number;
  isEditing: boolean;
  lastUpdated: Date; // ✅ Padronizado para Date
  theme: 'light' | 'dark';
  notifications: number;
}

export class UserProfileComponent extends LiveComponent<UserProfileState> {
  constructor(initialState: UserProfileState, ws: any, options?: { room?: string; userId?: string }) {
    const defaultState: UserProfileState = {
      name: "João Silva",
      email: "joao.silva@example.com",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      status: "online",
      bio: "Desenvolvedor Full-Stack apaixonado por tecnologia e inovação. Sempre em busca de novos desafios!",
      location: "São Paulo, Brasil",
      joinedDate: "Janeiro 2023",
      followers: 1234,
      following: 567,
      posts: 89,
      isEditing: false,
      lastUpdated: new Date(),
      theme: "light",
      notifications: 5,
      ...initialState
    };

    super(defaultState, ws, options);
    console.log('👤 UserProfile component created:', this.id, { initialState: defaultState });
  }

  async updateProfile(payload: { name?: string; bio?: string; location?: string }) {
    const updates: Partial<UserProfileState> = {
      lastUpdated: new Date()
    };

    if (payload.name) updates.name = payload.name;
    if (payload.bio) updates.bio = payload.bio;
    if (payload.location) updates.location = payload.location;

    this.setState(updates);
    console.log('👤 Profile updated:', this.id, updates);
    return { success: true, updated: Object.keys(updates) };
  }

  async toggleStatus() {
    const statuses: UserProfileState['status'][] = ['online', 'away', 'busy', 'offline'];
    const currentIndex = statuses.indexOf(this.state.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    this.setState({
      status: nextStatus,
      lastUpdated: new Date()
    });

    console.log('👤 Status changed:', this.id, { from: this.state.status, to: nextStatus });
    return { success: true, newStatus: nextStatus };
  }

  async toggleTheme() {
    const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
    this.setState({
      theme: newTheme,
      lastUpdated: new Date()
    });

    console.log('👤 Theme changed:', this.id, { to: newTheme });
    return { success: true, theme: newTheme };
  }

  async followUser() {
    this.setState({
      followers: this.state.followers + 1,
      lastUpdated: new Date()
    });

    console.log('👤 New follower:', this.id, { followers: this.state.followers + 1 });
    return { success: true, followers: this.state.followers };
  }

  async toggleEdit() {
    this.setState({
      isEditing: !this.state.isEditing,
      lastUpdated: new Date()
    });

    console.log('👤 Edit mode toggled:', this.id, { isEditing: !this.state.isEditing });
    return { success: true, isEditing: this.state.isEditing };
  }

  async clearNotifications() {
    this.setState({
      notifications: 0,
      lastUpdated: new Date()
    });

    console.log('👤 Notifications cleared:', this.id);
    return { success: true };
  }

  async updateAvatar(payload: { imageUrl: string }) {
    if (!payload.imageUrl) {
      throw new Error('Invalid image URL');
    }

    this.setState({
      avatar: payload.imageUrl,
      lastUpdated: new Date()
    });

    console.log('👤 Avatar updated:', this.id, {
      newAvatar: payload.imageUrl,
      previousAvatar: this.state.avatar
    });

    return {
      success: true,
      avatar: payload.imageUrl,
      message: 'Avatar updated successfully!'
    };
  }

  // Override destroy for cleanup
  public destroy() {
    console.log(`🗑️ UserProfile component ${this.id} destroyed`)
    super.destroy()
  }
}