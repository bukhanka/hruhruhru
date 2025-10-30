import { create } from 'zustand';
import { ChatState, Message } from '@/types/chat';

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isTyping: false,
  persona: null,
  conversationStage: 'initial',
  
  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },
  
  setTyping: (isTyping) => set({ isTyping }),
  
  setPersona: (persona) => set({ persona }),
  
  setConversationStage: (stage) => set({ conversationStage: stage }),
  
  clearChat: () => set({
    messages: [],
    isTyping: false,
    persona: null,
    conversationStage: 'initial',
  }),
}));

