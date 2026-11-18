export const CHECKLIST_FIELDS = [
  "productsReviewed",
  "flowersPrepared",
  "customVerified",
  "extrasIncluded",
  "greetingCardIncluded",
  "recipientVerified",
  "packagingCompleted",
  "readyForHandoff",
] as const;

export type ChecklistField = (typeof CHECKLIST_FIELDS)[number];

export const CHECKLIST_LABELS: Record<
  ChecklistField,
  { en: string; vi: string }
> = {
  productsReviewed: {
    en: "Products reviewed",
    vi: "Đã xem sản phẩm",
  },
  flowersPrepared: {
    en: "Flowers prepared",
    vi: "Đã chuẩn bị hoa",
  },
  customVerified: {
    en: "Custom arrangement verified",
    vi: "Đã kiểm tra bó tùy chỉnh",
  },
  extrasIncluded: {
    en: "Extras included",
    vi: "Đã kèm quà thêm",
  },
  greetingCardIncluded: {
    en: "Greeting card included",
    vi: "Đã kèm thiệp",
  },
  recipientVerified: {
    en: "Recipient details verified",
    vi: "Đã xác minh người nhận",
  },
  packagingCompleted: {
    en: "Packaging completed",
    vi: "Đã đóng gói",
  },
  readyForHandoff: {
    en: "Ready for delivery / pickup",
    vi: "Sẵn sàng giao / nhận",
  },
};

export function checklistComplete(row: Partial<Record<ChecklistField, boolean>>) {
  return CHECKLIST_FIELDS.every((f) => Boolean(row[f]));
}

/** Statuses that require checklist (or override) before allowing. */
export const CHECKLIST_GATE_STATUSES = new Set([
  "ready_for_pickup",
  "ready_for_dispatch",
  "out_for_delivery",
  "delivered",
  "completed",
]);
