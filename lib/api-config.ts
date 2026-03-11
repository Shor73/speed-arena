export interface ProviderConfig {
  baseUrl: string;
  path: string;
  model: string;
  apiFormat: 'openai' | 'anthropic' | 'google';
}

export const API_CONFIG: Record<string, ProviderConfig> = {
  taalas: {
    baseUrl: 'https://api.taalas.com',
    path: '/v1/chat/completions',
    model: 'llama3.1-8B',
    apiFormat: 'openai',
  },
  openai: {
    baseUrl: 'https://api.openai.com',
    path: '/v1/chat/completions',
    model: 'gpt-4.1-nano',
    apiFormat: 'openai',
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com',
    path: '/v1/messages',
    model: 'claude-haiku-4-5-20251001',
    apiFormat: 'anthropic',
  },
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com',
    path: '',
    model: 'gemini-flash-latest',
    apiFormat: 'google',
  },
  zhipu: {
    baseUrl: 'https://api.z.ai',
    path: '/api/coding/paas/v4/chat/completions',
    model: 'glm-4.7-flashx',
    apiFormat: 'openai',
  },
  cerebras: {
    baseUrl: 'https://api.cerebras.ai/v1',
    path: '/chat/completions',
    model: 'llama-4-scout-17b-16e-instruct',
    apiFormat: 'openai',
  },
  fireworks: {
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    path: '/chat/completions',
    model: 'accounts/fireworks/models/deepseek-v3p1',
    apiFormat: 'openai',
  },
  mistral: {
    baseUrl: 'https://api.mistral.ai/v1',
    path: '/chat/completions',
    model: 'mistral-small-latest',
    apiFormat: 'openai',
  },
  xai: {
    baseUrl: 'https://api.x.ai/v1',
    path: '/chat/completions',
    model: 'grok-4-1-fast',
    apiFormat: 'openai',
  },
  minimax: {
    baseUrl: 'https://api.minimaxi.com/v1',
    path: '/chat/completions',
    model: 'MiniMax-M1',
    apiFormat: 'openai',
  },
  kimi: {
    baseUrl: 'https://api.moonshot.ai/v1',
    path: '/chat/completions',
    model: 'kimi-k2-0711',
    apiFormat: 'openai',
  },
};
