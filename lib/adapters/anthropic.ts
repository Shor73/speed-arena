import { API_CONFIG } from '../api-config';
import type { StreamEvent } from '../types';

const DATA_PREFIX = 'data: ';
const DATA_PREFIX_LEN = DATA_PREFIX.length;
const DOUBLE_NL = '\n\n';

export async function* streamAnthropic(prompt: string, userApiKey?: string): AsyncGenerator<StreamEvent> {
  const apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    yield { type: 'error', message: 'ANTHROPIC_API_KEY not configured' };
    return;
  }

  const { baseUrl, path, model } = API_CONFIG.anthropic;

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    yield { type: 'error', message: `Anthropic API error ${response.status}: ${errorText}` };
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let outputTokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Scan for complete SSE events (separated by \n\n) using indexOf
    let pos = 0;
    let sepIdx = buffer.indexOf(DOUBLE_NL, pos);
    while (sepIdx !== -1) {
      const event = buffer.substring(pos, sepIdx);
      pos = sepIdx + 2;

      // Find the "data: " line within this event without split+find
      const dataPayload = extractDataPayload(event);
      if (dataPayload === null) {
        sepIdx = buffer.indexOf(DOUBLE_NL, pos);
        continue;
      }

      try {
        const data = JSON.parse(dataPayload);

        if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
          yield { type: 'text', content: data.delta.text };
        }

        if (data.type === 'message_delta' && data.usage?.output_tokens) {
          outputTokens = data.usage.output_tokens;
        }

        if (data.type === 'message_stop') {
          yield { type: 'done', outputTokens };
          return;
        }
      } catch { /* skip */ }
      sepIdx = buffer.indexOf(DOUBLE_NL, pos);
    }
    buffer = pos > 0 ? buffer.substring(pos) : buffer;
  }
  yield { type: 'done', outputTokens };
}

/** Extract the JSON payload from a "data: ..." line inside an SSE event block, without splitting. */
function extractDataPayload(event: string): string | null {
  // Check each line within the event for "data: " prefix
  let lineStart = 0;
  while (lineStart < event.length) {
    let lineEnd = event.indexOf('\n', lineStart);
    if (lineEnd === -1) lineEnd = event.length;
    // Check if this line starts with "data: " (possibly with leading whitespace)
    let i = lineStart;
    while (i < lineEnd && (event.charCodeAt(i) === 32 || event.charCodeAt(i) === 9)) i++;
    if (event.startsWith(DATA_PREFIX, i)) {
      return event.substring(i + DATA_PREFIX_LEN, lineEnd);
    }
    lineStart = lineEnd + 1;
  }
  return null;
}
