import { API_CONFIG } from '../api-config';
import type { StreamEvent } from '../types';

const DATA_PREFIX = 'data: ';
const DATA_PREFIX_LEN = DATA_PREFIX.length;
const DONE_SIGNAL = '[DONE]';

export async function* streamOpenAICompatible(
  providerId: string,
  prompt: string,
  apiKey: string,
): AsyncGenerator<StreamEvent> {
  const config = API_CONFIG[providerId];
  if (!config) {
    yield { type: 'error', message: `Unknown provider: ${providerId}` };
    return;
  }

  const url = `${config.baseUrl}${config.path}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    yield { type: 'error', message: `${providerId} API error ${response.status}: ${errorText}` };
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

    // Scan for complete lines using indexOf — zero array allocations per chunk
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
        const delta = parsed.choices?.[0]?.delta;
        // Some providers (e.g. Zhipu) send reasoning_content before content
        const content = delta?.content || delta?.reasoning_content;
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
}

/** Find the start index of the JSON payload after "data: ", skipping leading whitespace. Returns -1 if not a data line. */
function findDataStart(line: string): number {
  let i = 0;
  while (i < line.length && (line.charCodeAt(i) === 32 || line.charCodeAt(i) === 9)) i++;
  if (line.startsWith(DATA_PREFIX, i)) return i + DATA_PREFIX_LEN;
  return -1;
}
