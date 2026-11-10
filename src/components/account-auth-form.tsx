"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
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
    <div className="mx-auto w-full max-w-md">
      <h1 className="font-display text-3xl text-forest sm:text-4xl">
        {mode === "login" ? t.loginTitle : t.registerTitle}
      </h1>
      <p className="mt-2 text-sm text-forest/70">
        {mode === "login" ? t.loginSubtitle : t.registerSubtitle}
      </p>

      {done ? (
        <p className="mt-8 rounded-2xl bg-cream px-4 py-3 text-sm text-forest">
          {t.registerCheckEmail}
        </p>
      ) : (
        <form action={onSubmit} className="mt-8 space-y-4">
          {mode === "register" ? (
            <label className="block text-sm">
              <span className="mb-1.5 block text-forest/80">{t.name}</span>
              <input
                name="name"
                autoComplete="name"
                className="min-h-11 w-full rounded-xl border border-forest/15 bg-white px-3"
              />
            </label>
          ) : null}
          <label className="block text-sm">
            <span className="mb-1.5 block text-forest/80">{t.email}</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="min-h-11 w-full rounded-xl border border-forest/15 bg-white px-3"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-forest/80">{t.password}</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="min-h-11 w-full rounded-xl border border-forest/15 bg-white px-3"
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
            className="btn-primary min-h-11 w-full justify-center"
          >
            {pending
              ? t.working
              : mode === "login"
                ? t.loginSubmit
                : t.registerSubmit}
          </button>
        </form>
      )}

      <div className="mt-6 space-y-3">
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
            className="min-h-11 w-full rounded-full border border-forest/15 bg-white px-4 text-sm font-medium text-forest transition hover:bg-cream"
          >
            {t.continueGoogle}
          </button>
        ) : null}
        {zaloEnabled ? (
          <a
            href={`/auth/zalo/start?locale=${locale}`}
            className="flex min-h-11 w-full items-center justify-center rounded-full border border-forest/15 bg-white px-4 text-sm font-medium text-forest transition hover:bg-cream"
          >
            {t.continueZalo}
          </a>
        ) : (
          <p className="text-center text-xs text-forest/50">{t.zaloSoon}</p>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-forest/70">
        {mode === "login" ? (
          <>
            {t.noAccount}{" "}
            <Link
              href={`/${locale}/account/register`}
              className="text-citrus underline-offset-2 hover:underline"
            >
              {t.registerLink}
            </Link>
          </>
        ) : (
          <>
            {t.hasAccount}{" "}
            <Link
              href={`/${locale}/account/login`}
              className="text-citrus underline-offset-2 hover:underline"
            >
              {t.loginLink}
            </Link>
          </>
        )}
      </p>
    </div>
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
