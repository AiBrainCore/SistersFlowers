/** Stable catalog attribute taxonomy (slug = internal ID). */

export type AttributeKind = "flower" | "color" | "style" | "arrangement";

export type TaxonomySeed = {
  kind: AttributeKind;
  slug: string;
  nameEn: string;
  nameVi: string;
  sortOrder: number;
};

export const CATALOG_TAXONOMY: TaxonomySeed[] = [
  // Flowers
  { kind: "flower", slug: "rose", nameEn: "Rose", nameVi: "Hoa hồng", sortOrder: 10 },
  { kind: "flower", slug: "lily", nameEn: "Lily", nameVi: "Hoa ly", sortOrder: 20 },
  { kind: "flower", slug: "carnation", nameEn: "Carnation", nameVi: "Cẩm chướng", sortOrder: 30 },
  { kind: "flower", slug: "gerbera", nameEn: "Gerbera", nameVi: "Đồng tiền", sortOrder: 40 },
  { kind: "flower", slug: "chrysanthemum", nameEn: "Chrysanthemum", nameVi: "Cúc", sortOrder: 50 },
  { kind: "flower", slug: "hydrangea", nameEn: "Hydrangea", nameVi: "Cẩm tú cầu", sortOrder: 60 },
  { kind: "flower", slug: "sunflower", nameEn: "Sunflower", nameVi: "Hướng dương", sortOrder: 70 },
  { kind: "flower", slug: "orchid", nameEn: "Orchid", nameVi: "Lan", sortOrder: 80 },
  { kind: "flower", slug: "tulip", nameEn: "Tulip", nameVi: "Tulip", sortOrder: 90 },
  { kind: "flower", slug: "baby-breath", nameEn: "Baby's breath", nameVi: "Baby breath", sortOrder: 100 },
  { kind: "flower", slug: "eucalyptus", nameEn: "Eucalyptus", nameVi: "Khuynh diệp", sortOrder: 110 },
  { kind: "flower", slug: "mixed-flowers", nameEn: "Mixed flowers", nameVi: "Hoa mix", sortOrder: 120 },
  // Colors
  { kind: "color", slug: "pink", nameEn: "Pink", nameVi: "Hồng", sortOrder: 10 },
  { kind: "color", slug: "red", nameEn: "Red", nameVi: "Đỏ", sortOrder: 20 },
  { kind: "color", slug: "white", nameEn: "White", nameVi: "Trắng", sortOrder: 30 },
  { kind: "color", slug: "yellow", nameEn: "Yellow", nameVi: "Vàng", sortOrder: 40 },
  { kind: "color", slug: "orange", nameEn: "Orange", nameVi: "Cam", sortOrder: 50 },
  { kind: "color", slug: "purple", nameEn: "Purple", nameVi: "Tím", sortOrder: 60 },
  { kind: "color", slug: "blue", nameEn: "Blue", nameVi: "Xanh dương", sortOrder: 70 },
  { kind: "color", slug: "pastel", nameEn: "Pastel", nameVi: "Pastel", sortOrder: 80 },
  { kind: "color", slug: "cream", nameEn: "Cream", nameVi: "Kem", sortOrder: 90 },
  { kind: "color", slug: "green", nameEn: "Green", nameVi: "Xanh lá", sortOrder: 100 },
  // Styles
  { kind: "style", slug: "romantic", nameEn: "Romantic", nameVi: "Lãng mạn", sortOrder: 10 },
  { kind: "style", slug: "elegant", nameEn: "Elegant", nameVi: "Thanh lịch", sortOrder: 20 },
  { kind: "style", slug: "minimalist", nameEn: "Minimalist", nameVi: "Tối giản", sortOrder: 30 },
  { kind: "style", slug: "luxury", nameEn: "Luxury", nameVi: "Sang trọng", sortOrder: 40 },
  { kind: "style", slug: "natural", nameEn: "Natural / wildflower", nameVi: "Tự nhiên", sortOrder: 50 },
  { kind: "style", slug: "modern", nameEn: "Modern", nameVi: "Hiện đại", sortOrder: 60 },
  { kind: "style", slug: "classic", nameEn: "Classic", nameVi: "Cổ điển", sortOrder: 70 },
  // Arrangement
  { kind: "arrangement", slug: "bouquet", nameEn: "Bouquet", nameVi: "Bó hoa", sortOrder: 10 },
  { kind: "arrangement", slug: "flower-basket", nameEn: "Flower basket", nameVi: "Giỏ hoa", sortOrder: 20 },
  { kind: "arrangement", slug: "flower-box", nameEn: "Flower box", nameVi: "Hộp hoa", sortOrder: 30 },
  { kind: "arrangement", slug: "vase", nameEn: "Vase arrangement", nameVi: "Bình hoa", sortOrder: 40 },
];

/** Map accent mood → color attribute slug */
export function accentToColorSlug(accent: string): string | null {
  const map: Record<string, string> = {
    rose: "red",
    blush: "pink",
    ivory: "cream",
    sage: "green",
  };
  return map[accent] || null;
}
