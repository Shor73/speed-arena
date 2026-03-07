export const metadata = {
  title: 'About — Speed Arena',
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-arena-white mb-2">About Speed Arena</h1>
      </div>

      <div className="space-y-6 font-mono text-sm leading-relaxed text-dim-light">
        <p>
          <span className="text-neon font-bold">Speed Arena</span> is a real-time LLM speed
          benchmark tool. Type a prompt and watch multiple AI models race to generate the
          response side-by-side, with live timers and token counters.
        </p>

        <p>
          Bring your own API keys to race any combination of 11 models from top providers.{' '}
          <span className="text-neon">Taalas HC1</span> is always in the race as the
          defending champion &mdash; no key needed.
        </p>

        <div className="border border-surface-light p-4 space-y-3">
          <h2 className="text-arena-white font-bold text-base">Models (11)</h2>
          <div className="space-y-2">
            <div>
              <span className="text-neon">Taalas HC1</span>{' '}
              <span className="text-dim">&mdash; Llama 3.1-8B (built-in, no key needed)</span>
            </div>
            <div>
              <span className="text-arena-white">GPT-4o Mini</span>{' '}
              <span className="text-dim">&mdash; OpenAI</span>
            </div>
            <div>
              <span className="text-arena-purple">Claude Opus 4.6</span>{' '}
              <span className="text-dim">&mdash; Anthropic</span>
            </div>
            <div>
              <span className="text-arena-blue">Gemini Flash</span>{' '}
              <span className="text-dim">&mdash; Google</span>
            </div>
            <div>
              <span className="text-arena-yellow">GLM-5</span>{' '}
              <span className="text-dim">&mdash; Zhipu AI</span>
            </div>
            <div>
              <span className="text-arena-red">Llama 4 Scout</span>{' '}
              <span className="text-dim">&mdash; Cerebras (2,600 tok/s)</span>
            </div>
            <div>
              <span className="text-arena-red">DeepSeek V3.1</span>{' '}
              <span className="text-dim">&mdash; Fireworks AI (355 tok/s)</span>
            </div>
            <div>
              <span className="text-arena-purple">Mistral Small</span>{' '}
              <span className="text-dim">&mdash; Mistral AI</span>
            </div>
            <div>
              <span className="text-arena-white">Grok 4.1 Fast</span>{' '}
              <span className="text-dim">&mdash; xAI</span>
            </div>
            <div>
              <span className="text-arena-yellow">MiniMax-M2.5</span>{' '}
              <span className="text-dim">&mdash; MiniMax</span>
            </div>
            <div>
              <span className="text-arena-blue">Kimi K2.5</span>{' '}
              <span className="text-dim">&mdash; Moonshot AI</span>
            </div>
          </div>
        </div>

        <div className="border border-surface-light p-4 space-y-3">
          <h2 className="text-arena-white font-bold text-base">How it works</h2>
          <div className="space-y-2 text-dim-light">
            <p>1. Add your API keys for the providers you want to race (keys stored in your browser only)</p>
            <p>2. Select which challengers to race against Taalas HC1</p>
            <p>3. Type a prompt and hit RACE</p>
            <p>4. Watch all models stream their responses simultaneously with live timers</p>
          </div>
        </div>

        <div className="border border-surface-light p-4 space-y-3">
          <h2 className="text-arena-white font-bold text-base">Links</h2>
          <div className="space-y-2">
            <div>
              <a
                href="https://taalas.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon hover:underline"
              >
                taalas.com
              </a>{' '}
              <span className="text-dim">&mdash; Taalas AI inference hardware</span>
            </div>
            <div>
              <a
                href="https://x.com/Geekissimo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-arena-white hover:underline"
              >
                @Geekissimo
              </a>{' '}
              <span className="text-dim">&mdash; Creator</span>
            </div>
          </div>
        </div>

        <p className="text-dim text-xs pt-4 border-t border-surface-light">
          Speed Arena is BYOK (Bring Your Own Key). API keys are stored locally in your browser
          and never logged on the server. Results may vary based on network conditions, server
          load, and prompt complexity.
        </p>
      </div>
    </main>
  );
}
