export const API_CONFIG = {
  taalas: {
    baseUrl: 'https://api.taalas.com',
    path: '/v1/chat/completions',
    model: 'llama-3.1-8b',
    envKey: 'TAALAS_API_KEY',
  },
  openai: {
    baseUrl: 'https://api.openai.com',
    path: '/v1/chat/completions',
    model: 'gpt-4o-mini',
    envKey: 'OPENAI_API_KEY',
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com',
    path: '/v1/messages',
    model: 'claude-opus-4-6',
    envKey: 'ANTHROPIC_API_KEY',
  },
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com',
    model: 'gemini-flash-latest',
    envKey: 'GOOGLE_AI_API_KEY',
  },
  zhipu: {
    baseUrl: 'https://api.z.ai',
    path: '/api/coding/paas/v4/chat/completions',
    model: 'glm-5',
    envKey: 'ZHIPU_API_KEY',
  },
} as const;
