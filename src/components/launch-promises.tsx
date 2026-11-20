import type { Dictionary } from "@/i18n/dictionaries";
import { Reveal } from "@/components/reveal";
import {
  IconBloom,
  IconHeart,
  IconTruck,
} from "@/components/nav-icons";

type PromiseItem = {
  title: string;
  body: string;
  icon: "photo" | "sameDay" | "chat";
};

function PromiseIcon({ kind }: { kind: PromiseItem["icon"] }) {
  const className = "h-6 w-6 text-citrus sm:h-7 sm:w-7";
  if (kind === "photo") return <IconBloom className={className} />;
  if (kind === "sameDay") return <IconTruck className={className} />;
  return <IconHeart className={className} />;
}

export function LaunchPromises({
  items,
  className = "",
}: {
  items: PromiseItem[];
  className?: string;
}) {
  return (
    <div
      className={`grid gap-3 sm:grid-cols-3 sm:gap-4 ${className}`.trim()}
      role="list"
    >
      {items.map((item, index) => (
        <Reveal key={item.title} delay={index as 0 | 1 | 2}>
          <div
            role="listitem"
            className="glass flex h-full flex-col gap-3 rounded-2xl border border-citrus/15 px-4 py-4 shadow-[0_12px_32px_rgba(44,41,38,0.07)] sm:px-5 sm:py-5"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cream/90 ring-1 ring-citrus/25 sm:h-13 sm:w-13">
              <PromiseIcon kind={item.icon} />
            </span>
            <div>
              <h3 className="serif text-lg leading-snug text-forest sm:text-xl">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-moss">{item.body}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function homeLaunchPromises(dictionary: Dictionary): PromiseItem[] {
  const t = dictionary.home;
  return [
    { title: t.promisePhotoTitle, body: t.promisePhotoBody, icon: "photo" },
    {
      title: t.promiseSameDayTitle,
      body: t.promiseSameDayBody,
      icon: "sameDay",
    },
    {
      title: t.promiseOverseasTitle,
      body: t.promiseOverseasBody,
      icon: "chat",
    },
  ];
}

export function deliveryLaunchPromises(dictionary: Dictionary): PromiseItem[] {
  const t = dictionary.delivery;
  return [
    { title: t.promisePhotoTitle, body: t.promisePhotoBody, icon: "photo" },
    { title: t.promiseSlaTitle, body: t.promiseSlaBody, icon: "sameDay" },
    { title: t.promisePayTitle, body: t.promisePayBody, icon: "chat" },
  ];
}
