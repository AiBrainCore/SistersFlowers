/** Shared preferred-delivery time slots (15-minute steps). */

export function deliveryTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 7; h <= 21; h += 1) {
    for (const m of [0, 15, 30, 45]) {
      if (h === 21 && m > 0) break;
      slots.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      );
    }
  }
  return slots;
}

export const DELIVERY_TIME_SLOTS = deliveryTimeSlots();
