"use client";

export function ShopBotChips({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap gap-2.5" role="group">
      {children}
    </div>
  );
}

export function ShopBotChip({
  label,
  onClick,
  selected,
  disabled,
}: {
  label: string;
  onClick: () => void;
  selected?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-11 rounded-full px-4 py-2.5 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citrus disabled:opacity-50 ${
        selected
          ? "bg-forest text-ivory shadow-sm"
          : "border border-forest/15 bg-white/80 text-forest hover:border-citrus/50 hover:bg-cream/80"
      }`}
    >
      {label}
    </button>
  );
}
