import type { Dictionary } from "@/i18n/dictionaries";
import { Reveal } from "@/components/reveal";

type PromiseItem = {
  title: string;
  body: string;
};

export function LaunchPromises({
  items,
  className = "",
}: {
  items: PromiseItem[];
  className?: string;
}) {
  return (
    <div
      className={`grid gap-6 sm:grid-cols-3 ${className}`.trim()}
      role="list"
    >
      {items.map((item, index) => (
        <Reveal key={item.title} delay={index as 0 | 1 | 2}>
          <div role="listitem" className="border-t border-citrus/40 pt-4">
            <p className="text-[11px] tracking-[0.16em] text-citrus uppercase">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 text-sm font-medium leading-snug text-forest">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-moss">{item.body}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function homeLaunchPromises(dictionary: Dictionary): PromiseItem[] {
  const t = dictionary.home;
  return [
    { title: t.promisePhotoTitle, body: t.promisePhotoBody },
    { title: t.promiseSameDayTitle, body: t.promiseSameDayBody },
    { title: t.promiseOverseasTitle, body: t.promiseOverseasBody },
  ];
}

export function deliveryLaunchPromises(dictionary: Dictionary): PromiseItem[] {
  const t = dictionary.delivery;
  return [
    { title: t.promisePhotoTitle, body: t.promisePhotoBody },
    { title: t.promiseSlaTitle, body: t.promiseSlaBody },
    { title: t.promisePayTitle, body: t.promisePayBody },
  ];
}
