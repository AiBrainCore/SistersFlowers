import type { ReactNode } from "react";

/** Soft branded frame for account / auth screens — same site header + footer. */
export function AccountShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(168deg,#fff8f2_0%,#ffe9dc_46%,#f5ebe3_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-citrus/15 blur-3xl"
      />
      <div className="relative mx-auto flex max-w-6xl items-center justify-center px-4 py-10 sm:px-5 sm:py-14">
        {children}
      </div>
    </div>
  );
}
