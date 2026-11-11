import type { ReactNode } from "react";

/** Marks account routes so the global Find us footer stays hidden. */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div data-sf-account>
      {children}
      <footer className="border-t border-forest/10 bg-cream/40">
        <p className="px-5 py-4 text-center text-[11px] leading-5 tracking-[0.08em] text-moss">
          Sisters Flowers
        </p>
      </footer>
    </div>
  );
}
