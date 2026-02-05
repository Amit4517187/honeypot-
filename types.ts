export interface Message {
  sender: 'scammer' | 'user' | 'agent';
  text: string;
  timestamp: string | number;
}

export interface Intelligence {
  bankAccounts: string[];
  upiIds: string[];
  phishingLinks: string[];
  phoneNumbers: string[];
  suspiciousKeywords: string[];
}

export interface Session {
  id: string;
  status: 'active' | 'completed' | 'scam_detected' | 'safe';
  messages: Message[];
  scamConfidence: number;
  extractedIntelligence: Intelligence;
  agentNotes: string;
  lastUpdated: string;
}

export interface ApiRequest {
  sessionId: string;
  message: {
    sender: 'scammer' | 'user';
    text: string;
    timestamp: number;
  };
  conversationHistory: {
    sender: 'scammer' | 'user';
    text: string;
    timestamp: number;
  }[];
  metadata?: {
    channel: string;
    language: string;
    locale: string;
  };
}

export interface ApiResponse {
  status: string;
  reply: string;
}

export interface CallbackPayload {
  sessionId: string;
  scamDetected: boolean;
  totalMessagesExchanged: number;
  extractedIntelligence: Intelligence;
  agentNotes: string;
}