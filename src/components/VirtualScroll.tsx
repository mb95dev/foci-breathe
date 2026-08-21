import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function VirtualScroll({ children }: Props) {
  return (
    <main className="virtual-scroll" data-testid="virtual-scroll">
      <div className="virtual-scroll-inner">
        {children}
      </div>
    </main>
  );
}
