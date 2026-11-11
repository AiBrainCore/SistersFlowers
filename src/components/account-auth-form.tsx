"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { BRAND } from "@/lib/brand";
import {
  loginWithEmailAction,
  registerWithEmailAction,
  startGoogleOAuthAction,
} from "@/app/actions/auth";

export function AccountAuthForm({
  locale,
  dictionary,
  mode,
  errorCode,
  googleEnabled,
  zaloEnabled,
}: {
  locale: Locale;
  dictionary: Dictionary;
  mode: "login" | "register";
  errorCode?: string | null;
  googleEnabled: boolean;
  zaloEnabled: boolean;
}) {
  const router = useRouter();
  const t = dictionary.account;
  const [error, setError] = useState<string | null>(mapError(errorCode, t));
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function onSubmit(formData: FormData) {
    setError(null);
    formData.set("locale", locale);
    startTransition(async () => {
      const result =
        mode === "register"
          ? await registerWithEmailAction(formData)
          : await loginWithEmailAction(formData);
      if (!result.ok) {
        setError(mapError(result.error, t));
        return;
      }
      if (mode === "register") {
        setDone(true);
        return;
      }
      router.push(`/${locale}/account`);
      router.refresh();
    });
  }

  return (
    <div className="relative mx-auto w-full max-w-[26rem]">
      <div className="overflow-hidden rounded-[1.75rem] border border-forest/10 bg-white shadow-[0_24px_60px_rgba(26,23,20,0.08)]">
        <div className="px-5 pt-7 sm:px-7">
          <p className="serif text-center text-xl tracking-wide text-forest">
            <Link href={`/${locale}`} className="hover:text-citrus">
              {BRAND.name}
            </Link>
          </p>

          <div
            role="tablist"
            aria-label={t.title}
            className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-cream/90 p-1"
          >
            <Link
              href={`/${locale}/account/login`}
              role="tab"
              aria-selected={mode === "login"}
              className={`flex min-h-11 items-center justify-center rounded-full text-sm transition ${
                mode === "login"
                  ? "bg-white font-medium text-forest shadow-sm"
                  : "text-moss hover:text-forest"
              }`}
            >
              {t.loginLink}
            </Link>
            <Link
              href={`/${locale}/account/register`}
              role="tab"
              aria-selected={mode === "register"}
              className={`flex min-h-11 items-center justify-center rounded-full text-sm transition ${
                mode === "register"
                  ? "bg-white font-medium text-forest shadow-sm"
                  : "text-moss hover:text-forest"
              }`}
            >
              {t.registerLink}
            </Link>
          </div>
        </div>

        <div className="px-5 pt-6 pb-7 sm:px-7 sm:pb-8">
          <h1 className="serif text-center text-3xl text-forest">
            {mode === "login" ? t.loginTitle : t.registerTitle}
          </h1>
          <p className="mt-2 text-center text-sm leading-6 text-moss">
            {mode === "login" ? t.loginSubtitle : t.registerSubtitle}
          </p>

          {done ? (
            <p className="mt-8 rounded-2xl bg-cream px-4 py-4 text-center text-sm leading-6 text-forest">
              {t.registerCheckEmail}
            </p>
          ) : (
            <form action={onSubmit} className="mt-7 space-y-3.5">
              {mode === "register" ? (
                <label className="block text-sm">
                  <span className="mb-1.5 block text-[11px] tracking-[0.14em] text-moss uppercase">
                    {t.name}
                  </span>
                  <input
                    name="name"
                    autoComplete="name"
                    className="min-h-12 w-full rounded-2xl border border-forest/12 bg-cream/40 px-4 text-forest outline-none transition focus:border-citrus/50 focus:bg-white"
                  />
                </label>
              ) : null}
              <label className="block text-sm">
                <span className="mb-1.5 block text-[11px] tracking-[0.14em] text-moss uppercase">
                  {t.email}
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="min-h-12 w-full rounded-2xl border border-forest/12 bg-cream/40 px-4 text-forest outline-none transition focus:border-citrus/50 focus:bg-white"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-[11px] tracking-[0.14em] text-moss uppercase">
                  {t.password}
                </span>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  className="min-h-12 w-full rounded-2xl border border-forest/12 bg-cream/40 px-4 text-forest outline-none transition focus:border-citrus/50 focus:bg-white"
                />
              </label>
              {error ? (
                <p className="text-sm text-citrus" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-citrus px-5 text-sm font-medium tracking-[0.06em] text-white uppercase transition hover:bg-citrus/90 disabled:opacity-60"
              >
                {pending
                  ? t.working
                  : mode === "login"
                    ? t.loginSubmit
                    : t.registerSubmit}
              </button>
            </form>
          )}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-forest/10" />
            <span className="text-[11px] tracking-[0.16em] text-moss uppercase">
              {t.orContinue}
            </span>
            <div className="h-px flex-1 bg-forest/10" />
          </div>

          <div className="space-y-2.5">
            {googleEnabled ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const result = await startGoogleOAuthAction(locale);
                    if (!result.ok) {
                      setError(mapError(result.error, t));
                      return;
                    }
                    if ("url" in result && result.url) {
                      window.location.href = result.url;
                    }
                  });
                }}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full border border-forest/12 bg-white px-4 text-sm font-medium text-forest transition hover:border-citrus/35 hover:bg-cream/60 disabled:opacity-60"
              >
                <GoogleMark />
                {t.continueGoogle}
              </button>
            ) : null}

            {zaloEnabled ? (
              <a
                href={`/auth/zalo/start?locale=${locale}`}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full border border-[#0068FF]/25 bg-[#0068FF] px-4 text-sm font-medium text-white transition hover:bg-[#0056d6]"
              >
                <ZaloMark />
                {t.continueZalo}
              </a>
            ) : (
              <p className="rounded-2xl bg-cream/70 px-4 py-3 text-center text-xs leading-5 text-moss">
                {t.zaloSoon}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.5-5.1 3.5-3.1 0-5.6-2.5-5.6-5.6S8.9 6.1 12 6.1c1.7 0 2.9.7 3.6 1.4l2.4-2.4C16.7 3.8 14.6 3 12 3 7 3 3 7 3 12s4 9 9 9c5.2 0 8.6-3.6 8.6-8.8 0-.6-.1-1-.2-1.5H12z"
      />
    </svg>
  );
}

function ZaloMark() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold tracking-tight text-[#0068FF]">
      Z
    </span>
  );
}

function mapError(code: string | null | undefined, t: Dictionary["account"]) {
  if (!code) return null;
  if (code === "auth_not_configured") return t.errorAuthConfig;
  if (code === "invalid_input") return t.errorInvalid;
  if (code === "zalo_not_configured") return t.errorZaloConfig;
  if (code.startsWith("zalo_")) return t.errorZalo;
  return code;
}
