import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { formatVnd, type Product } from "@/data/products";

export function ProductCard({
  product,
  locale,
}: {
  product: Product;
  locale: Locale;
}) {
  return (
    <Link
      href={`/${locale}/shop/${product.slug}`}
      className="group flex h-full flex-col [perspective:900px]"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-cream shadow-[0_12px_28px_rgba(36,53,42,0.08)] transition duration-500 ease-out will-change-transform group-hover:-translate-y-1.5 group-hover:shadow-[0_20px_40px_rgba(232,106,43,0.18)] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
        <Image
          src={product.image}
          alt={product.names[locale]}
          fill
          className="object-cover transition duration-700 ease-out group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-forest/25 to-transparent opacity-0 transition duration-500 group-hover:opacity-100 motion-reduce:hidden" />
      </div>
      <div className="mt-3 flex min-h-[4.5rem] flex-1 flex-col gap-1 px-0.5">
        <h3 className="serif line-clamp-2 text-lg leading-snug text-forest sm:text-xl">
          {product.names[locale]}
        </h3>
        <p className="mt-auto text-sm font-medium tracking-wide text-citrus">
          {formatVnd(product.price, locale)}
        </p>
      </div>
    </Link>
  );
}
