export type ModelId = 'taalas' | 'openai' | 'anthropic' | 'google' | 'zhipu';

export interface StreamEvent {
  type: 'text' | 'done' | 'error';
  content?: string;
  outputTokens?: number;
  message?: string;
}

export interface ModelState {
  status: 'idle' | 'streaming' | 'done' | 'error';
  text: string;
  tokens: number;
  startTime: number | null;
  firstTokenTime: number | null;
  endTime: number | null;
  error: string | null;
}

export interface ModelInfo {
  id: ModelId;
  displayName: string;
  subtitle: string;
  provider: string;
}

export interface RaceResult {
  id: string;
  timestamp: number;
  prompt: string;
  results: {
    modelId: ModelId;
    displayName: string;
    tokens: number;
    totalTime: number;
    tokPerSec: number;
    ttft: number;
  }[];
}

export const MODELS: ModelInfo[] = [
  { id: 'taalas', displayName: 'Taalas HC1', subtitle: 'Llama 3.1-8B', provider: 'Taalas' },
  { id: 'openai', displayName: 'ChatGPT 5.3 Instant', subtitle: 'OpenAI', provider: 'OpenAI' },
  { id: 'anthropic', displayName: 'Claude Opus 4.6 Fast', subtitle: 'Anthropic', provider: 'Anthropic' },
  { id: 'google', displayName: 'Gemini 3.1 Pro Fast', subtitle: 'Google', provider: 'Google' },
  { id: 'zhipu', displayName: 'GLM-5', subtitle: 'Zhipu AI', provider: 'Zhipu' },
];
