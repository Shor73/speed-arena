import { API_CONFIG } from '../api-config';
import type { StreamEvent } from '../types';

const DATA_PREFIX = 'data: ';
const DATA_PREFIX_LEN = DATA_PREFIX.length;
const DONE_SIGNAL = '[DONE]';

export async function* streamTaalas(prompt: string): AsyncGenerator<StreamEvent> {
  const apiKey = process.env.TAALAS_API_KEY;
  if (!apiKey) {
    yield { type: 'error', message: 'TAALAS_API_KEY not configured' };
    return;
  }

  const { baseUrl, path, model } = API_CONFIG.taalas;

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    yield { type: 'error', message: `Taalas API error ${response.status}: ${errorText}` };
    return;
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('text/event-stream') || contentType.includes('octet-stream')) {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let outputTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Scan for complete lines using indexOf instead of split()
      let pos = 0;
      let nlIdx = buffer.indexOf('\n', pos);
      while (nlIdx !== -1) {
        const line = buffer.substring(pos, nlIdx);
        pos = nlIdx + 1;

        const dataStart = findDataStart(line);
        if (dataStart === -1) {
          nlIdx = buffer.indexOf('\n', pos);
          continue;
        }

        const data = line.substring(dataStart);
        if (data === DONE_SIGNAL) {
          yield { type: 'done', outputTokens };
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            outputTokens++;
            yield { type: 'text', content };
          }
          if (parsed.usage?.completion_tokens) {
            outputTokens = parsed.usage.completion_tokens;
          }
        } catch { /* skip unparseable lines */ }
        nlIdx = buffer.indexOf('\n', pos);
      }
      buffer = pos > 0 ? buffer.substring(pos) : buffer;
    }
    yield { type: 'done', outputTokens };
  } else {
    // Non-streaming response (Taalas may return all at once)
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';
    const outputTokens = data.usage?.completion_tokens || Math.ceil(content.length / 4);
    if (content) {
      yield { type: 'text', content };
    }
    yield { type: 'done', outputTokens };
  }
}

/** Find the start index of the JSON payload after "data: ", skipping leading whitespace. Returns -1 if not a data line. */
function findDataStart(line: string): number {
  let i = 0;
  while (i < line.length && (line.charCodeAt(i) === 32 || line.charCodeAt(i) === 9)) i++;
  if (line.startsWith(DATA_PREFIX, i)) return i + DATA_PREFIX_LEN;
  return -1;
}
