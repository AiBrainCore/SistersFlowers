"use client";

import { useState, useTransition } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { updateCustomerProfileAction } from "@/app/actions/customer-profile";

export function AccountProfileForm({
  dictionary,
  initial,
}: {
  dictionary: Dictionary;
  initial: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
}) {
  const t = dictionary.account;
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<"saved" | "error" | null>(null);

  function onSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateCustomerProfileAction(formData);
      setMessage(result.ok ? "saved" : "error");
    });
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      <p className="text-sm leading-6 text-moss">{t.profileBody}</p>
      <label className="block">
        <span className="text-[11px] tracking-[0.16em] text-moss uppercase">
          {t.name}
        </span>
        <input
          name="name"
          defaultValue={initial.name}
          autoComplete="name"
          className="mt-2 min-h-11 w-full rounded-full border border-forest/15 bg-white px-4 py-3 text-sm outline-none focus:border-citrus"
        />
      </label>
      <label className="block">
        <span className="text-[11px] tracking-[0.16em] text-moss uppercase">
          {t.email}
        </span>
        <input
          name="email"
          type="email"
          defaultValue={initial.email}
          autoComplete="email"
          className="mt-2 min-h-11 w-full rounded-full border border-forest/15 bg-white px-4 py-3 text-sm outline-none focus:border-citrus"
        />
      </label>
      <label className="block">
        <span className="text-[11px] tracking-[0.16em] text-moss uppercase">
          {t.phone}
        </span>
        <input
          name="phone"
          type="tel"
          defaultValue={initial.phone}
          autoComplete="tel"
          className="mt-2 min-h-11 w-full rounded-full border border-forest/15 bg-white px-4 py-3 text-sm outline-none focus:border-citrus"
        />
      </label>
      <label className="block">
        <span className="text-[11px] tracking-[0.16em] text-moss uppercase">
          {t.address}
        </span>
        <input
          name="address"
          defaultValue={initial.address}
          autoComplete="street-address"
          className="mt-2 min-h-11 w-full rounded-full border border-forest/15 bg-white px-4 py-3 text-sm outline-none focus:border-citrus"
        />
      </label>

      {message === "saved" ? (
        <p className="text-sm text-forest">{t.profileSaved}</p>
      ) : null}
      {message === "error" ? (
        <p className="text-sm text-rose">{t.profileError}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex min-h-11 items-center justify-center rounded-full bg-citrus px-6 text-[12px] tracking-[0.16em] text-white uppercase transition hover:bg-citrus/90 disabled:opacity-60"
      >
        {pending ? t.working : t.saveProfile}
      </button>
    </form>
  );
}
