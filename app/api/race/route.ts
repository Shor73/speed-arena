export const runtime = 'edge';
export const preferredRegion = ['fra1', 'cdg1', 'arn1'];

import { streamTaalas } from '@/lib/adapters/taalas';
import { streamAnthropic } from '@/lib/adapters/anthropic';
import { streamGoogle } from '@/lib/adapters/google';
import { streamOpenAICompatible } from '@/lib/adapters/openai-compatible';
import { API_CONFIG } from '@/lib/api-config';
import type { StreamEvent } from '@/lib/types';

// Reuse a single encoder across all requests (TextEncoder is stateless & thread-safe)
const encoder = new TextEncoder();

// Warm TCP+TLS connection to Taalas on edge isolate startup
const _warmup = fetch('https://api.taalas.com/health').catch(() => {});

export async function POST(request: Request) {
  const { model, prompt, apiKey } = await request.json() as {
    model: string;
    prompt: string;
    apiKey?: string;
  };

  const config = API_CONFIG[model];
  if (!config) {
    return new Response(JSON.stringify({ error: `Unknown model: ${model}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!prompt?.trim()) {
    return new Response(JSON.stringify({ error: 'Prompt is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Taalas uses server-side env key; all others require BYOK key from request
  if (model !== 'taalas' && !apiKey) {
    return new Response(JSON.stringify({ error: 'API key is required for this provider' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Select the right adapter based on API format
  let adapter: AsyncGenerator<StreamEvent>;
  if (model === 'taalas') {
    adapter = streamTaalas(prompt);
  } else if (config.apiFormat === 'anthropic') {
    adapter = streamAnthropic(prompt, apiKey!);
  } else if (config.apiFormat === 'google') {
    adapter = streamGoogle(prompt, apiKey!);
  } else {
    adapter = streamOpenAICompatible(model, prompt, apiKey!);
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of adapter) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (err) {
        const errorEvent: StreamEvent = {
          type: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Content-Encoding': 'identity',
      'X-Accel-Buffering': 'no',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
