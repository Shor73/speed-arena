import { API_CONFIG } from '../api-config';
import type { StreamEvent } from '../types';

const DATA_PREFIX = 'data: ';
const DATA_PREFIX_LEN = DATA_PREFIX.length;
const DOUBLE_NL = '\n\n';

export async function* streamGoogle(prompt: string): AsyncGenerator<StreamEvent> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    yield { type: 'error', message: 'GOOGLE_AI_API_KEY not configured' };
    return;
  }

  const { model } = API_CONFIG.google;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    yield { type: 'error', message: `Google AI error ${response.status}: ${errorText}` };
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let outputTokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Google's SSE uses \r\n (CRLF) line endings — normalize to \n
    buffer += decoder.decode(value, { stream: true }).replaceAll('\r\n', '\n');

    // Scan for complete SSE events (separated by \n\n) using indexOf
    let pos = 0;
    let sepIdx = buffer.indexOf(DOUBLE_NL, pos);
    while (sepIdx !== -1) {
      const event = buffer.substring(pos, sepIdx);
      pos = sepIdx + 2;

      // Extract data payload without split+find
      const dataPayload = extractDataPayload(event);
      if (dataPayload !== null) {
        try {
          const data = JSON.parse(dataPayload);
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            yield { type: 'text', content: text };
          }
          if (data.usageMetadata?.candidatesTokenCount) {
            outputTokens = data.usageMetadata.candidatesTokenCount;
          }
        } catch { /* skip */ }
      }
      sepIdx = buffer.indexOf(DOUBLE_NL, pos);
    }
    buffer = pos > 0 ? buffer.substring(pos) : buffer;
  }

  // Process any remaining data in the buffer
  if (buffer.trim()) {
    const dataPayload = extractDataPayload(buffer);
    if (dataPayload !== null) {
      try {
        const data = JSON.parse(dataPayload);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          yield { type: 'text', content: text };
        }
        if (data.usageMetadata?.candidatesTokenCount) {
          outputTokens = data.usageMetadata.candidatesTokenCount;
        }
      } catch { /* skip */ }
    }
  }

  yield { type: 'done', outputTokens };
}

/** Extract the JSON payload from a "data: ..." line inside an SSE event block, without splitting. */
function extractDataPayload(event: string): string | null {
  let lineStart = 0;
  while (lineStart < event.length) {
    let lineEnd = event.indexOf('\n', lineStart);
    if (lineEnd === -1) lineEnd = event.length;
    let i = lineStart;
    while (i < lineEnd && (event.charCodeAt(i) === 32 || event.charCodeAt(i) === 9)) i++;
    if (event.startsWith(DATA_PREFIX, i)) {
      return event.substring(i + DATA_PREFIX_LEN, lineEnd);
    }
    lineStart = lineEnd + 1;
  }
  return null;
}
