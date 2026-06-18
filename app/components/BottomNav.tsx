'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/', label: 'Heute', icon: '○' },
  { href: '/history', label: 'Verlauf', icon: '≡' },
  { href: '/setup', label: 'Profil', icon: '◎' },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] flex justify-around items-center px-4 py-3"
      style={{ background: 'rgba(13,13,20,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid #1a1a2e' }}
    >
      {nav.map(({ href, label, icon }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 px-6 py-1 transition-all"
            style={{ color: active ? '#ff6b8a' : '#8888aa' }}
          >
            <span className="text-xl">{icon}</span>
            <span className="text-xs font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
