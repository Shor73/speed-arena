```
   _____ ____  ________________     ___    ____  _______   _____
  / ___// __ \/  ____/ ____/ __ \  /   |  / __ \/  ___/ | / /   |
  \__ \/ /_/ / __/ / __/ / / / /  / /| | / /_/ / __/ /  |/ / /| |
 ___/ / ____/ /___/ /___/ /_/ /  / ___ |/ _, _/ /___/ /|  / ___ |
/____/_/   /_____/_____/_____/  /_/  |_/_/ |_/_____/_/ |_/_/  |_|
```

[![Live Demo](https://img.shields.io/badge/demo-speed--arena.vercel.app-00ff41?style=flat-square&logo=vercel)](https://speed-arena.vercel.app)
[![GitHub Stars](https://img.shields.io/github/stars/Shor73/speed-arena?style=flat-square&logo=github&color=00ff41)](https://github.com/Shor73/speed-arena)
[![License: MIT](https://img.shields.io/badge/license-MIT-00ff41?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-000?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-95.5%25-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Powered by Taalas](https://img.shields.io/badge/Powered%20by-Taalas%20HC1-00ff41?style=flat-square)](https://taalas.com)

# Speed Arena

> Race LLMs head-to-head. Bring your own API keys.

Type a prompt. Hit **RACE**. Watch up to 11 AI models sprint to generate the response — with live timers, token counters, and auto-scrolling output. The speed difference speaks for itself.

**BYOK** (Bring Your Own Key) — Taalas HC1 is always in the race as the defending champion. Add your own API keys for the challengers you want to race. Keys are stored locally in your browser and never logged on the server.

## Why

AI inference speed varies by **100x** across providers — but no one shows you this in real-time.

Speed Arena makes the invisible visible. Type a prompt, watch models race, and see the difference with your own eyes.

[Taalas HC1](https://taalas.com) hard-wires Llama 3.1 8B directly into silicon — no GPU, no HBM, no liquid cooling. The result: ~17,000 tokens/sec per user. This tool lets you see what that actually looks like compared to frontier models.

---

## The Stack

```
Next.js 16.1.6 (Turbopack)  —  React 19  —  Tailwind CSS 4  —  TypeScript
```

No database. No auth. No bloat. Just raw SSE streaming piped straight from 11 provider APIs to your browser.

## Models in the Arena

| # | Model | Provider | Key | Format |
|---|-------|----------|-----|--------|
| 1 | **Taalas HC1** (Llama 3.1-8B) | [Taalas](https://taalas.com) | Built-in | OpenAI |
| 2 | **GPT-4.1 nano** | OpenAI | BYOK | OpenAI |
| 3 | **Claude 4.5 Haiku** | Anthropic | BYOK | Custom |
| 4 | **Gemini Flash** | Google | BYOK | Custom |
| 5 | **GLM-4.7 FlashX** | Zhipu AI (100+ tok/s) | BYOK | OpenAI |
| 6 | **Llama 4 Scout** | Cerebras (2,600 tok/s) | BYOK | OpenAI |
| 7 | **DeepSeek V3.1** | Fireworks AI (355 tok/s) | BYOK | OpenAI |
| 8 | **Mistral Small** | Mistral AI | BYOK | OpenAI |
| 9 | **Grok 4.1 Fast** | xAI | BYOK | OpenAI |
| 10 | **MiniMax-M2.5** | MiniMax | BYOK | OpenAI |
| 11 | **Kimi K2.5** | Moonshot AI | BYOK | OpenAI |

8 of 11 providers use the OpenAI-compatible chat completions format, handled by a single reusable adapter factory. Anthropic and Google have dedicated adapters for their custom streaming APIs.

## Architecture

```
Browser                          Server (Next.js API Route)
  |                                  |
  |  POST /api/race                  |
  |  {model, prompt, apiKey?}        |
  |--------------------------------->|
  |                                  |---> Taalas: uses server env key
  |                                  |---> Others: uses apiKey from body
  |                                  |
  |                                  |---> select adapter by apiFormat:
  |                                  |     openai-compatible (8 providers)
  |                                  |     anthropic (custom SSE)
  |                                  |     google (custom SSE + CRLF)
  |                                  |
  |  SSE: data: {type:"text",...}    |<--- reader.read() chunk
  |<---------------------------------|
  |  SSE: data: {type:"done",...}    |<--- stream ends
  |<---------------------------------|
  |                                  |
  |  x N parallel connections        |
  └----------------------------------┘
```

One `POST /api/race` per model. Up to 11 parallel SSE streams. No WebSockets. No polling. Just the browser's native `ReadableStream` API consuming server-sent events as fast as the providers can push them.

### BYOK Security Model

```
localStorage ──> fetch body ──> Next.js server ──> provider API
                                     |
                                 never stored
                                 never logged
```

- Taalas HC1: server-side key in `.env` (never exposed to client)
- All other models: API key sent in request body, forwarded to provider, then discarded
- Keys stored in `localStorage` under `speed-arena-keys` — user can clear anytime

## Performance Optimizations

This codebase is obsessively optimized for minimum latency between prompt submission and first visible token:

**Server-side (API Route + Adapters)**

- `indexOf`-based SSE buffer scanning — zero array allocations per chunk
- `TextEncoder` hoisted to module scope — reused across all requests
- Anti-buffering headers: `X-Accel-Buffering: no`, `no-transform`, `nosniff`
- CRLF normalization for Google's non-standard SSE line endings
- Adapter factory pattern: one generic adapter handles 8 OpenAI-compatible providers

**Client-side (React 19)**

- `requestAnimationFrame` token batching — coalesces all incoming SSE chunks into a single `dispatch()` per frame (~60Hz cap vs hundreds of raw events/sec)
- Every component wrapped in `React.memo` — during a race, only the column receiving tokens re-renders
- `useMemo` for winner detection and speed multiplier calculation
- Stable `useCallback` references to prevent child re-renders
- Incremental token estimation per chunk (O(1)) instead of re-scanning entire text (O(n))

**CSS**

- `contain: layout style paint` on response areas — isolates each column from layout thrashing
- `content-visibility: auto` for deferred rendering of off-screen columns
- GPU-composited animations via `will-change` + pseudo-element opacity transitions
- Flash effect uses `::after` with opacity-only keyframes (compositor thread, no main thread paint)

**Next.js Config**

- Turbopack build (~2s)
- `optimizeCss` experimental flag (minification + dedup)
- Gzip/Brotli compression, ETags, no source maps in production
- Font preloading with `display: swap`

## Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FShor73%2Fspeed-arena&env=TAALAS_API_KEY)

Or run locally:

```bash
git clone https://github.com/Shor73/speed-arena.git && cd speed-arena && npm install
cp .env.example .env  # add your Taalas key
npm run dev
```

Create `.env` in the project root (only Taalas key is required):

```
TAALAS_API_KEY=your_key_here
```

All other provider keys are entered by users in the browser UI (BYOK).

```bash
npm run dev        # development (Turbopack)
npm run build      # production build
npm run start      # production server
```

## Project Structure

```
speed-arena/
├── app/
│   ├── api/race/route.ts        # SSE streaming endpoint (BYOK routing)
│   ├── page.tsx                 # Race UI (useReducer + RAF batching)
│   ├── layout.tsx               # Root layout (fonts, metadata, anti-FOUC)
│   ├── about/page.tsx           # About page (11 models)
│   └── leaderboard/page.tsx     # Local leaderboard
├── components/
│   ├── RaceColumn.tsx           # Per-model streaming column
│   ├── RaceInput.tsx            # Prompt input + RACE button
│   ├── ModelSelector.tsx        # Champion + Challengers grid
│   ├── ModelCard.tsx            # Provider card (key input, toggle)
│   ├── Timer.tsx                # RAF-driven live timer
│   ├── TokenCounter.tsx         # Live token count
│   ├── Header.tsx               # Navigation + theme toggle
│   ├── ThemeToggle.tsx          # Dark/light mode
│   ├── ResultsSummary.tsx       # Post-race bar chart
│   ├── ShareButton.tsx          # Share on X
│   └── Leaderboard.tsx          # localStorage aggregate stats
├── lib/
│   ├── types.ts                 # ModelId (11), ModelInfo, StreamEvent
│   ├── api-config.ts            # 11 provider configs (URL, model, format)
│   ├── key-store.ts             # localStorage API key management
│   ├── utils.ts                 # generateId()
│   └── adapters/
│       ├── taalas.ts            # Taalas (server-side key, streaming)
│       ├── openai-compatible.ts # Factory for 8 OpenAI-format providers
│       ├── anthropic.ts         # Anthropic Messages API (SSE)
│       └── google.ts            # Gemini streamGenerateContent (CRLF)
└── .env                         # Taalas server key only (not committed)
```

## How It Works

Each adapter is an `AsyncGenerator<StreamEvent>` that:

1. Opens a streaming HTTP connection to the provider
2. Parses the provider-specific SSE format (OpenAI-style `data: [DONE]`, Anthropic `message_stop`, Google's CRLF events, Zhipu's `reasoning_content` + `content`)
3. Yields normalized `{type: 'text', content}` events
4. Yields `{type: 'done', outputTokens}` when complete

The API route selects the right adapter based on `apiFormat` (openai/anthropic/google) and pipes it as SSE to the browser. The browser runs parallel `fetch()` calls and dispatches token events through a React `useReducer` with RAF batching.

## Metrics

| Metric | Description |
|--------|-------------|
| **TTFT** | Time to first token — latency before the model starts generating |
| **TOTAL** | Wall-clock time from request to last token |
| **TOK/S** | Tokens per second — throughput (formatted with comma separators: `15,696`) |

## Contributing

PRs welcome. Ideas for new models, UI improvements, or additional metrics — [open an issue](https://github.com/Shor73/speed-arena/issues).

If this was useful, consider giving it a ⭐

## License

MIT

---

Built by [@Geekissimo](https://x.com/Geekissimo) | Powered by [Taalas HC1](https://taalas.com)
