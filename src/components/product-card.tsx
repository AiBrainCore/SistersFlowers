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
    <Link href={`/${locale}/shop/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-cream">
        <Image
          src={product.image}
          alt={product.names[locale]}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes="(min-width: 1024px) 33vw, 100vw"
        />
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="serif text-2xl leading-tight">{product.names[locale]}</h3>
          <p className="mt-1 text-xs tracking-[0.12em] text-moss uppercase">
            {product.tags[locale]}
          </p>
        </div>
        <p className="text-sm">{formatVnd(product.price, locale)}</p>
      </div>
    </Link>
  );
}
