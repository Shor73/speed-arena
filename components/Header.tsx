'use client';

import { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Race' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/about', label: 'About' },
] as const;

export default memo(function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-surface-light">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-mono text-lg font-bold tracking-wider text-neon">
            SPEED ARENA<span className="animate-blink">_</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-mono text-sm uppercase tracking-wide transition-colors ${
                  pathname === link.href
                    ? 'text-neon'
                    : 'text-dim-light hover:text-arena-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-dim">
          <a
            href="https://x.com/Geekissimo"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-arena-white transition-colors"
          >
            @Geekissimo
          </a>
          <span className="text-surface-light">|</span>
          <a
            href="https://taalas.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neon transition-colors"
          >
            Powered by Taalas HC1
          </a>
        </div>
        {/* Mobile nav */}
        <nav className="flex sm:hidden items-center gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-mono text-xs uppercase ${
                pathname === link.href ? 'text-neon' : 'text-dim-light'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
});
