```
   _____ ____  ________________     ___    ____  _______   _____
  / ___// __ \/ ____/ ____/ __ \   /   |  / __ \/ ____/ | / /   |
  \__ \/ /_/ / __/ / __/ / / / /  / /| | / /_/ / __/ /  |/ / /| |
 ___/ / ____/ /___/ /___/ /_/ /  / ___ |/ _, _/ /___/ /|  / ___ |
/____/_/   /_____/_____/_____/  /_/  |_/_/ |_/_____/_/ |_/_/  |_|
```

# Speed Arena

> Race LLMs head-to-head. Watch the speed difference in real-time.

Type a prompt. Hit **RACE**. Watch 5 AI models sprint to generate the response — with live timers, token counters, and auto-scrolling output. The speed difference speaks for itself.

---

## The Stack

```
Next.js 16.1.6 (Turbopack)  ─  React 19  ─  Tailwind CSS 4  ─  TypeScript
```

No database. No auth. No bloat. Just raw SSE streaming piped straight from 5 provider APIs to your browser.

## Models in the Arena

| # | Model | Provider | Color |
|---|-------|----------|-------|
| 1 | **Taalas HC1** (Llama 3.1-8B) | [Taalas](https://taalas.com) | `#00ff41` |
| 2 | **ChatGPT 5.3 Instant** | OpenAI | `#e0e0e0` |
| 3 | **Claude Opus 4.6 Fast** | Anthropic | `#9b59b6` |
| 4 | **Gemini 3.1 Pro Fast** | Google | `#4169e1` |
| 5 | **GLM-5** | Zhipu AI | `#ffd700` |

## Architecture

```
Browser                          Server (Next.js API Route)
  |                                  |
  |  POST /api/race {model, prompt}  |
  |─────────────────────────────────>|
  |                                  |──> fetch(provider_api, stream:true)
  |  SSE: data: {type:"text",...}    |<── reader.read() chunk
  |<─────────────────────────────────|
  |  SSE: data: {type:"text",...}    |<── reader.read() chunk
  |<─────────────────────────────────|
  |  SSE: data: {type:"done",...}    |<── stream ends
  |<─────────────────────────────────|
  |                                  |
  |  x5 parallel connections         |
  └──────────────────────────────────┘
```

One `POST /api/race` per model. Five parallel SSE streams. No WebSockets. No polling. Just the browser's native `ReadableStream` API consuming server-sent events as fast as the providers can push them.

## Performance Optimizations

This codebase is obsessively optimized for minimum latency between prompt submission and first visible token:

**Server-side (API Route + Adapters)**
- `indexOf`-based SSE buffer scanning — zero array allocations per chunk
- `TextEncoder` hoisted to module scope — reused across all requests
- Anti-buffering headers: `X-Accel-Buffering: no`, `no-transform`, `nosniff`
- CRLF normalization for Google's non-standard SSE line endings

**Client-side (React 19)**
- `requestAnimationFrame` token batching — coalesces all incoming SSE chunks into a single `dispatch()` per frame (~60Hz cap vs hundreds of raw events/sec)
- Every component wrapped in `React.memo` — during a 5-model race, only the column receiving tokens re-renders
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

## Getting Started

```bash
git clone https://github.com/Shor73/speed-arena.git
cd speed-arena
npm install
```

Create `.env` in the project root:

```env
TAALAS_API_KEY=your_key_here
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...
ZHIPU_API_KEY=your_key_here
```

Run:

```bash
npm run dev        # development (Turbopack)
npm run build      # production build
npm run start      # production server
```

## Project Structure

```
speed-arena/
├── app/
│   ├── api/race/route.ts     # SSE streaming endpoint
│   ├── page.tsx              # Race UI (useReducer + RAF batching)
│   ├── layout.tsx            # Root layout (fonts, metadata)
│   ├── about/page.tsx        # About page
│   └── leaderboard/page.tsx  # Local leaderboard
├── components/
│   ├── RaceColumn.tsx        # Per-model streaming column
│   ├── RaceInput.tsx         # Prompt input + RACE button
│   ├── ModelSelector.tsx     # Toggle models on/off
│   ├── Timer.tsx             # RAF-driven live timer
│   ├── TokenCounter.tsx      # Live token count
│   ├── Header.tsx            # Navigation
│   ├── ResultsSummary.tsx    # Post-race bar chart
│   ├── ShareButton.tsx       # Share on X
│   └── Leaderboard.tsx       # localStorage aggregate stats
├── lib/
│   ├── types.ts              # ModelId, ModelState, StreamEvent
│   ├── api-config.ts         # Provider URLs and model IDs
│   ├── utils.ts              # generateId()
│   └── adapters/
│       ├── taalas.ts         # OpenAI-compatible streaming
│       ├── openai.ts         # Chat Completions API
│       ├── anthropic.ts      # Messages API (SSE)
│       ├── google.ts         # Gemini streamGenerateContent
│       └── zhipu.ts          # GLM-5 (thinking model)
└── .env                      # API keys (not committed)
```

## How It Works

Each adapter is an `AsyncGenerator<StreamEvent>` that:

1. Opens a streaming HTTP connection to the provider
2. Parses the provider-specific SSE format (OpenAI-style `data: [DONE]`, Anthropic `message_stop`, Google's CRLF events, Zhipu's `reasoning_content` + `content`)
3. Yields normalized `{type: 'text', content}` events
4. Yields `{type: 'done', outputTokens}` when complete

The API route wraps any adapter in a `ReadableStream` and pipes it as SSE to the browser. The browser runs 5 parallel `fetch()` calls and dispatches token events through a React `useReducer` with RAF batching.

## Metrics

| Metric | Description |
|--------|-------------|
| **TTFT** | Time to first token — latency before the model starts generating |
| **TOTAL** | Wall-clock time from request to last token |
| **TOK/S** | Tokens per second — throughput (formatted with comma separators: `15,696`) |

## License

MIT

---

<sub>Built by [@Geekissimo](https://x.com/Geekissimo) | Powered by [Taalas HC1](https://taalas.com)</sub>
