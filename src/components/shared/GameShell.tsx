import type { ReactNode } from 'react';

interface GameShellProps {
  children: ReactNode;
}

export function GameShell({ children }: GameShellProps) {
  return (
    <div className="mx-auto max-w-[600px] px-4 py-4 md:px-0">
      {children}
    </div>
  );
}
