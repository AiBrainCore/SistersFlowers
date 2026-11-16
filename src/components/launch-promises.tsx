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
  const className = "h-5 w-5 text-citrus";
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
      className={`rounded-[1.75rem] border border-forest/8 bg-white/75 p-5 shadow-[0_16px_40px_rgba(44,41,38,0.06)] sm:rounded-[2rem] sm:p-8 ${className}`.trim()}
      role="list"
    >
      <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
        {items.map((item, index) => (
          <Reveal key={item.title} delay={index as 0 | 1 | 2}>
            <div
              role="listitem"
              className={`flex flex-col gap-3 ${
                index > 0 ? "sm:border-l sm:border-citrus/20 sm:pl-6" : ""
              }`}
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-cream ring-1 ring-citrus/20">
                <PromiseIcon kind={item.icon} />
              </span>
              <div>
                <h3 className="serif text-xl leading-snug text-forest sm:text-[1.35rem]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-moss">{item.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
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
