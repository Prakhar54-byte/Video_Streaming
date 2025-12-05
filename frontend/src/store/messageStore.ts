import { create } from "zustand";

interface Message {
  _id: string;
  content: string;
  owner: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  createdAt: string;
  likes?: number;
  liked?: boolean;
}

interface MessageStore {
  messages: Message[];
  activeConversation: string | null;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
}

export const useMessageStore = create<MessageStore>((set) => ({
  messages: [],
  activeConversation: null,
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [message, ...state.messages] })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === id ? { ...msg, ...updates } : msg,
      ),
    })),
  deleteMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg._id !== id),
    })),
  setActiveConversation: (id) => set({ activeConversation: id }),
}));
