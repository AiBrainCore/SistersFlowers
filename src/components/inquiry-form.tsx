"use client";

import { useState, type FormEvent } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { submitInquiryAction } from "@/app/actions/orders";

type Variant = "custom" | "wedding" | "hotel";

export function InquiryForm({
  dictionary,
  variant,
  presetMessage,
  notesLabel,
}: {
  dictionary: Dictionary;
  variant: Variant;
  presetMessage?: string;
  notesLabel?: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const formData = new FormData(event.currentTarget);
    formData.set("variant", variant);

    if (presetMessage) {
      const notes = String(formData.get("notes") || "").trim();
      const message = notes
        ? `${presetMessage}\n\n${notes}`
        : presetMessage;
      formData.set("message", message);
    }

    const result = await submitInquiryAction(formData);
    setStatus(result.ok ? "success" : "error");
  }

  if (status === "success") {
    return (
      <div className="rounded-3xl bg-cream/80 px-8 py-12">
        <p className="text-[11px] tracking-[0.22em] text-rose uppercase">
          Sisters Flowers
        </p>
        <h2 className="serif mt-3 text-3xl text-forest">
          {dictionary.form.successTitle}
        </h2>
        <p className="mt-4 max-w-md text-sm leading-7 text-moss">
          {dictionary.form.successBody}
        </p>
        <button
          type="button"
          className="mt-8 text-[12px] tracking-[0.16em] uppercase border-b border-forest pb-0.5"
          onClick={() => setStatus("idle")}
        >
          {dictionary.form.another}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <Field label={dictionary.form.name} name="name" required />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={dictionary.form.email} name="email" type="email" required />
        <Field label={dictionary.form.phone} name="phone" />
      </div>
      {variant === "hotel" ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={dictionary.form.hotel} name="hotel" required />
          <Field label={dictionary.form.room} name="room" />
        </div>
      ) : null}
      {variant === "wedding" ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={dictionary.form.venue} name="venue" />
          <Field label={dictionary.form.guests} name="guests" />
        </div>
      ) : null}
      <Field label={dictionary.form.date} name="date" type="date" />
      {presetMessage ? (
        <>
          <div className="rounded-2xl border border-forest/10 bg-cream/50 px-4 py-3 text-sm leading-6 text-moss whitespace-pre-line">
            {presetMessage}
          </div>
          <label className="block">
            <span className="text-[11px] tracking-[0.16em] text-moss uppercase">
              {notesLabel || dictionary.form.message}
            </span>
            <textarea
              name="notes"
              rows={3}
              className="mt-2 w-full rounded-2xl border border-forest/15 bg-white/70 px-4 py-3 text-sm outline-none focus:border-rose"
            />
          </label>
        </>
      ) : (
        <label className="block">
          <span className="text-[11px] tracking-[0.16em] text-moss uppercase">
            {dictionary.form.message}
          </span>
          <textarea
            name="message"
            required
            rows={5}
            className="mt-2 w-full rounded-2xl border border-forest/15 bg-white/70 px-4 py-3 text-sm outline-none focus:border-rose"
          />
        </label>
      )}
      {status === "error" ? (
        <p className="text-sm text-rose">Could not send. Please try again.</p>
      ) : null}
      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-2 rounded-full bg-forest px-8 py-3 text-[12px] tracking-[0.18em] text-ivory uppercase disabled:opacity-60"
      >
        {status === "sending" ? dictionary.form.sending : dictionary.form.submit}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.16em] text-moss uppercase">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-2 w-full rounded-full border border-forest/15 bg-white/70 px-4 py-3 text-sm outline-none focus:border-rose"
      />
    </label>
  );
}
