import { API_CONFIG } from '../api-config';
import type { StreamEvent } from '../types';

const DATA_PREFIX = 'data: ';
const DATA_PREFIX_LEN = DATA_PREFIX.length;
const DONE_SIGNAL = '[DONE]';

export async function* streamOpenAI(prompt: string): AsyncGenerator<StreamEvent> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    yield { type: 'error', message: 'OPENAI_API_KEY not configured' };
    return;
  }

  const { baseUrl, path, model } = API_CONFIG.openai;

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
      stream_options: { include_usage: true },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    yield { type: 'error', message: `OpenAI API error ${response.status}: ${errorText}` };
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

    // Scan for complete lines using indexOf instead of split() to avoid array allocation
    let pos = 0;
    let nlIdx = buffer.indexOf('\n', pos);
    while (nlIdx !== -1) {
      const line = buffer.substring(pos, nlIdx);
      pos = nlIdx + 1;

      // Skip empty lines and non-data lines without trim() allocation
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
      } catch { /* skip */ }
      nlIdx = buffer.indexOf('\n', pos);
    }
    // Keep only the unprocessed remainder
    buffer = pos > 0 ? buffer.substring(pos) : buffer;
  }
  yield { type: 'done', outputTokens };
}

/** Find the start index of the JSON payload after "data: ", skipping leading whitespace. Returns -1 if not a data line. */
function findDataStart(line: string): number {
  let i = 0;
  while (i < line.length && (line.charCodeAt(i) === 32 || line.charCodeAt(i) === 9)) i++;
  if (line.startsWith(DATA_PREFIX, i)) return i + DATA_PREFIX_LEN;
  return -1;
}
