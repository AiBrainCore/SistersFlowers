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
      className="group flex h-full flex-col"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-cream shadow-[0_10px_30px_rgba(44,58,48,0.06)] transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_16px_36px_rgba(224,122,61,0.16)]">
        <Image
          src={product.image}
          alt={product.names[locale]}
          fill
          className="object-cover transition duration-700 group-hover:scale-[1.04]"
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
        />
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
