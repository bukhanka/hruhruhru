export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageType = 'text' | 'buttons' | 'cards' | 'questions';

export interface Message {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  timestamp: number;
  buttons?: string[];
  cards?: ProfessionCard[];
  metadata?: Record<string, any>;
}

export interface ProfessionCard {
  slug: string;
  profession: string;
  level: string;
  company: string;
  image?: string;
  description?: string;
}

export interface UserPersona {
  experience?: string; // junior, middle, senior
  interests?: string[];
  currentRole?: string;
  goals?: string[];
  isUncertain?: boolean;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  persona: UserPersona | null;
  conversationStage: 'initial' | 'clarifying' | 'exploring' | 'showing_results';
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setTyping: (isTyping: boolean) => void;
  setPersona: (persona: UserPersona) => void;
  setConversationStage: (stage: ChatState['conversationStage']) => void;
  clearChat: () => void;
}

export interface ChatRequest {
  message: string;
  history: Message[];
  persona?: UserPersona;
}

export interface ChatResponse {
  message: Message;
  persona?: UserPersona;
  stage?: ChatState['conversationStage'];
}

