import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { listPaymentMethodsForDisplay } from "@/lib/payments/catalog";

export async function PaymentMethodsPreview({
  locale,
  dictionary,
  citySlug,
}: {
  locale: Locale;
  dictionary: Dictionary;
  citySlug?: string;
}) {
  const methods = await listPaymentMethodsForDisplay({ citySlug });
  const t = dictionary.payments;
  const visible = methods.filter((m) => m.id !== "whatsapp");

  return (
    <div className="mt-5 rounded-2xl border border-forest/10 bg-white/70 px-3.5 py-3">
      <p className="text-[11px] tracking-[0.14em] text-moss uppercase">
        {t.methodsTitle}
      </p>
      <ul className="mt-2.5 flex flex-wrap gap-2">
        {visible.map((m) => {
          const label = locale === "vi" ? m.nameVi : m.nameEn;
          const soon = !m.selectable;
          return (
            <li
              key={m.id}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-2.5 text-xs ${
                soon
                  ? "border-forest/10 bg-cream/50 text-moss/70"
                  : "border-citrus/35 bg-citrus/8 text-forest"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.icon} alt="" width={18} height={18} className="rounded" />
              <span>{label}</span>
              {soon ? (
                <span className="text-[10px] tracking-wide uppercase opacity-80">
                  {t.comingSoon}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {!visible.some((m) => m.selectable) ? (
        <p className="mt-2 text-xs text-moss">{t.noneActive}</p>
      ) : null}
    </div>
  );
}
