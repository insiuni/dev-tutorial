export type ReflectionMode = 'reflection' | 'summary' | 'brainstorm' | 'chat';

export type PerspectiveLens = 'mindful' | 'stoic' | 'compassionate' | 'future_self' | 'socratic';

export type EmotionalMood = 'reflective' | 'grateful' | 'anxious' | 'inspired' | 'heavy' | 'resolute';

export interface CognitiveClarityInsights {
  sentiment: string;
  keyTheme: string;
  cognitiveReframe: string;
  microIntention: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface JournalInteraction {
  id?: string;
  userId: string;
  title: string;
  entryText: string;
  aiResponse: string;
  mode: ReflectionMode;
  lens?: PerspectiveLens;
  mood?: EmotionalMood;
  clarityInsights?: CognitiveClarityInsights;
  conversation: ChatMessage[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReflectionPrompt {
  category: string;
  prompt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
