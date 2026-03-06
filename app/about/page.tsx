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
          The goal is simple: make the speed difference between AI inference providers
          visually obvious. When you see{' '}
          <span className="text-neon">Taalas HC1</span> flash its response instantly
          while other models are still streaming token by token, the difference speaks
          for itself.
        </p>

        <div className="border border-surface-light p-4 space-y-3">
          <h2 className="text-arena-white font-bold text-base">Models</h2>
          <div className="space-y-2">
            <div>
              <span className="text-neon">Taalas HC1</span>{' '}
              <span className="text-dim">— Llama 3.1-8B running on Taalas hardware</span>
            </div>
            <div>
              <span className="text-arena-white">ChatGPT 5.3 Instant</span>{' '}
              <span className="text-dim">— OpenAI</span>
            </div>
            <div>
              <span className="text-arena-purple">Claude Opus 4.6 Fast</span>{' '}
              <span className="text-dim">— Anthropic</span>
            </div>
            <div>
              <span className="text-arena-blue">Gemini 3.1 Pro Fast</span>{' '}
              <span className="text-dim">— Google</span>
            </div>
            <div>
              <span className="text-arena-yellow">GLM-5</span>{' '}
              <span className="text-dim">— Zhipu AI</span>
            </div>
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
              <span className="text-dim">— Taalas AI inference hardware</span>
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
              <span className="text-dim">— Creator</span>
            </div>
          </div>
        </div>

        <p className="text-dim text-xs pt-4 border-t border-surface-light">
          Speed Arena is a private benchmark tool. All API calls use personal API keys.
          Results may vary based on network conditions, server load, and prompt complexity.
        </p>
      </div>
    </main>
  );
}
