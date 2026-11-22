"use client";

import { useState, useTransition } from "react";
import { reportCustomerPaidAction } from "@/app/actions/payments";

export function PaymentReportedButton({
  trackingToken,
  label,
  doneLabel,
  busyLabel,
  errorLabel,
}: {
  trackingToken: string;
  label: string;
  doneLabel: string;
  busyLabel: string;
  errorLabel: string;
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  if (done) {
    return (
      <p className="mt-6 rounded-2xl border border-citrus/25 bg-citrus/5 px-4 py-3 text-sm leading-6 text-forest">
        {doneLabel}
      </p>
    );
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={pending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-citrus px-5 text-sm tracking-wide text-white transition hover:bg-citrus/90 disabled:opacity-60 sm:w-auto"
        onClick={() => {
          setError(false);
          startTransition(async () => {
            const result = await reportCustomerPaidAction(trackingToken);
            if (!result.ok) {
              setError(true);
              return;
            }
            setDone(true);
          });
        }}
      >
        {pending ? busyLabel : label}
      </button>
      {error ? (
        <p className="mt-2 text-xs text-rose">{errorLabel}</p>
      ) : null}
    </div>
  );
}
