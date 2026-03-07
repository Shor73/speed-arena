export type ModelId = 'taalas' | 'openai' | 'anthropic' | 'google' | 'zhipu' | 'cerebras' | 'fireworks' | 'mistral' | 'xai' | 'minimax' | 'kimi';

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
  keySource: 'server' | 'byok';
  apiFormat: 'openai' | 'anthropic' | 'google';
  docsUrl?: string;
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
  { id: 'taalas', displayName: 'Taalas HC1', subtitle: 'Llama 3.1-8B', provider: 'Taalas', keySource: 'server', apiFormat: 'openai' },
  { id: 'openai', displayName: 'GPT-4o Mini', subtitle: 'OpenAI', provider: 'OpenAI', keySource: 'byok', apiFormat: 'openai', docsUrl: 'https://platform.openai.com/api-keys' },
  { id: 'anthropic', displayName: 'Claude Opus 4.6', subtitle: 'Anthropic', provider: 'Anthropic', keySource: 'byok', apiFormat: 'anthropic', docsUrl: 'https://console.anthropic.com/settings/keys' },
  { id: 'google', displayName: 'Gemini Flash', subtitle: 'Google', provider: 'Google', keySource: 'byok', apiFormat: 'google', docsUrl: 'https://aistudio.google.com/app/apikey' },
  { id: 'zhipu', displayName: 'GLM-5', subtitle: 'Zhipu AI', provider: 'Zhipu', keySource: 'byok', apiFormat: 'openai', docsUrl: 'https://open.bigmodel.cn/usercenter/apikeys' },
  { id: 'cerebras', displayName: 'Llama 4 Scout', subtitle: 'Cerebras', provider: 'Cerebras', keySource: 'byok', apiFormat: 'openai', docsUrl: 'https://cloud.cerebras.ai/' },
  { id: 'fireworks', displayName: 'DeepSeek V3.1', subtitle: 'Fireworks AI', provider: 'Fireworks', keySource: 'byok', apiFormat: 'openai', docsUrl: 'https://fireworks.ai/account/api-keys' },
  { id: 'mistral', displayName: 'Mistral Small', subtitle: 'Mistral AI', provider: 'Mistral', keySource: 'byok', apiFormat: 'openai', docsUrl: 'https://console.mistral.ai/api-keys' },
  { id: 'xai', displayName: 'Grok 4.1 Fast', subtitle: 'xAI', provider: 'xAI', keySource: 'byok', apiFormat: 'openai', docsUrl: 'https://console.x.ai/' },
  { id: 'minimax', displayName: 'MiniMax-M2.5', subtitle: 'MiniMax', provider: 'MiniMax', keySource: 'byok', apiFormat: 'openai', docsUrl: 'https://platform.minimaxi.com/' },
  { id: 'kimi', displayName: 'Kimi K2.5', subtitle: 'Moonshot AI', provider: 'Moonshot', keySource: 'byok', apiFormat: 'openai', docsUrl: 'https://platform.moonshot.ai/' },
];
