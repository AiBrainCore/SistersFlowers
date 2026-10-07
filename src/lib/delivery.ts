export type DeliveryConfig = {
  studioName: string;
  includedKm: number;
  baseFee: number;
  midKm: number;
  midFee: number;
  maxKm: number;
  maxFee: number;
};

export type DeliveryZonePublic = {
  id: string;
  nameEn: string;
  nameVi: string;
  km: number;
  quoteOnly: boolean;
  noteEn: string;
  noteVi: string;
  sortOrder: number;
};

export const defaultDeliveryConfig: DeliveryConfig = {
  studioName: "Da Lat",
  includedKm: 8,
  baseFee: 30000,
  midKm: 20,
  midFee: 60000,
  maxKm: 45,
  maxFee: 120000,
};

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

/** Interpolated fee from studio distance. Null = beyond max, quote manually. */
export function calcDeliveryFee(km: number, config: DeliveryConfig): number | null {
  const distance = Math.max(0, km);
  if (distance > config.maxKm) return null;
  if (distance <= config.includedKm) return config.baseFee;
  if (distance <= config.midKm) {
    const t =
      (distance - config.includedKm) / Math.max(1, config.midKm - config.includedKm);
    return lerp(config.baseFee, config.midFee, t);
  }
  const t =
    (distance - config.midKm) / Math.max(1, config.maxKm - config.midKm);
  return lerp(config.midFee, config.maxFee, t);
}

export function deliveryZoneLabel(km: number, config: DeliveryConfig, locale: "en" | "vi") {
  if (km <= config.includedKm) {
    return locale === "vi" ? "Gần studio" : "Near studio";
  }
  if (km <= config.midKm) {
    return locale === "vi" ? "Cao nguyên gần" : "Nearby highlands";
  }
  if (km <= config.maxKm) {
    return locale === "vi" ? "Đường xa hơn" : "Further roads";
  }
  return locale === "vi" ? "Xa hơn — báo giá" : "Beyond — quoted";
}
