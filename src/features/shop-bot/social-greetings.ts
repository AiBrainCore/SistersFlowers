import { buildAssistantPath } from "./params";

/** Manual / native auto-reply templates only — no social APIs. */
export function buildSocialGreetingTemplates(origin: string) {
  const base = origin.replace(/\/$/, "");
  const viBudget = `${base}${buildAssistantPath("vi", { budgetMaxVnd: 300_000, source: "zalo" })}`;
  const viShop = `${base}/vi/shop`;
  const viCustom = `${base}/vi/custom`;
  const viGift = `${base}${buildAssistantPath("vi", { intent: "gift", source: "zalo" })}`;
  const enBudget = `${base}${buildAssistantPath("en", { budgetMaxVnd: 300_000, source: "whatsapp" })}`;
  const enShop = `${base}/en/shop`;
  const enCustom = `${base}/en/custom`;
  const enGift = `${base}${buildAssistantPath("en", { intent: "gift", source: "whatsapp" })}`;

  return {
    vi: `Sisters Flowers xin chào 🌼 Bạn muốn chọn hoa nhanh không? Bó hoa khoảng 300k: ${viBudget} • Xem tất cả: ${viShop} • Hoa theo yêu cầu: ${viCustom} • Quà tặng & voucher: ${viGift}. Cần hỗ trợ giao hoa, cứ nhắn tụi mình nhé!`,
    en: `Hello from Sisters Flowers 🌼 Find a bouquet around 300k: ${enBudget} • Browse all flowers: ${enShop} • Custom bouquet: ${enCustom} • Gifts & vouchers: ${enGift}. We can help confirm delivery details.`,
    links: {
      vi: { budget300: viBudget, shop: viShop, custom: viCustom, gift: viGift },
      en: { budget300: enBudget, shop: enShop, custom: enCustom, gift: enGift },
    },
  };
}
