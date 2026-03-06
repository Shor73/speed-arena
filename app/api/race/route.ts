import { streamTaalas } from '@/lib/adapters/taalas';
import { streamOpenAI } from '@/lib/adapters/openai';
import { streamAnthropic } from '@/lib/adapters/anthropic';
import { streamGoogle } from '@/lib/adapters/google';
import { streamZhipu } from '@/lib/adapters/zhipu';
import type { ModelId, StreamEvent } from '@/lib/types';

const adapters: Record<ModelId, (prompt: string) => AsyncGenerator<StreamEvent>> = {
  taalas: streamTaalas,
  openai: streamOpenAI,
  anthropic: streamAnthropic,
  google: streamGoogle,
  zhipu: streamZhipu,
};

// Reuse a single encoder across all requests (TextEncoder is stateless & thread-safe)
const encoder = new TextEncoder();

export async function POST(request: Request) {
  const { model, prompt } = await request.json() as { model: ModelId; prompt: string };

  if (!adapters[model]) {
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

  const adapter = adapters[model];

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of adapter(prompt)) {
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
      'X-Accel-Buffering': 'no',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
