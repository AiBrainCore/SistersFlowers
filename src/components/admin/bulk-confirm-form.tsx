"use client";

import type { FormEvent, ReactNode } from "react";

/**
 * Server-action form with a browser confirm before submit.
 * Blocks mass price mistakes when markup/discount/reset overlap in an admin’s head.
 */
export function BulkConfirmForm({
  action,
  confirmMessage,
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage: string;
  className?: string;
  children: ReactNode;
}) {
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} className={className} onSubmit={onSubmit}>
      {children}
    </form>
  );
}
